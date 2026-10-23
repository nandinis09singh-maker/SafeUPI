package com.safeupi.service.engine;

import com.safeupi.dto.IndicatorDetail;
import com.safeupi.repository.ScamIndicatorRepository;
import com.safeupi.repository.ScamReportRepository;
import org.springframework.stereotype.Component;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class QrRuleEvaluator {

    private final ScamReportRepository scamReportRepository;
    private final ScamIndicatorRepository scamIndicatorRepository;

    private static final Set<String> HIGH_RISK_KEYWORDS = Set.of(
            "refund", "cashback", "lottery", "kyc", "customer care", "customercare", "helpdesk",
            "support", "helpline", "urgent", "reward", "prize", "bonus", "winner", "kbc",
            "electricity", "overdue", "disconnection", "billdesk", "airtel 5g", "gift"
    );

    private static final Set<String> BANK_AND_CORP_NAMES = Set.of(
            "sbi", "hdfc", "icici", "axis", "punjab national", "pnb", "bank of baroda", "bob",
            "paytm payment bank", "airtel payment", "phonepe support", "google pay support",
            "electricity board", "mahadiscom", "bses", "bescom", "tata power", "income tax"
    );

    public QrRuleEvaluator(ScamReportRepository scamReportRepository,
                           ScamIndicatorRepository scamIndicatorRepository) {
        this.scamReportRepository = scamReportRepository;
        this.scamIndicatorRepository = scamIndicatorRepository;
    }

    public static class QrEvaluationResult {
        public int score;
        public String payeeVpa;
        public String payeeName;
        public String amount;
        public String transactionNote;
        public List<IndicatorDetail> indicators = new ArrayList<>();
        public List<String> recommendations = new ArrayList<>();
        public String explanation;
    }

    public QrEvaluationResult evaluate(String rawPayload) {
        QrEvaluationResult result = new QrEvaluationResult();
        int score = 0;

        if (rawPayload == null || rawPayload.trim().isEmpty()) {
            result.score = 80;
            result.indicators.add(new IndicatorDetail("QR_EMPTY", "Empty QR Payload",
                    "The scanned QR code contained no readable data.", "HIGH", 80));
            result.explanation = "The QR code payload is empty or unreadable.";
            result.recommendations.add("Do not attempt to scan this QR code again.");
            return result;
        }

        String payload = rawPayload.trim();

        // 1. UPI Scheme Check & Parameter Extraction
        Map<String, String> params = parseUpiUri(payload);
        result.payeeVpa = params.get("pa");
        result.payeeName = params.get("pn");
        result.amount = params.get("am");
        result.transactionNote = params.get("tn");

        String lowerPayload = payload.toLowerCase();
        boolean isStandardUpi = lowerPayload.startsWith("upi://pay") || lowerPayload.contains("upi://pay");
        boolean isBharatQr = payload.startsWith("000201");
        boolean isWebLink = lowerPayload.startsWith("http://") || lowerPayload.startsWith("https://");

        if (isBharatQr) {
            // BharatQR / EMVCo Standard POS Terminal format
            parseBharatQr(payload, result);
            result.indicators.add(new IndicatorDetail("BHARAT_QR_POS", "Official NPCI BharatQR / POS Terminal",
                    "This QR code follows the official NPCI EMVCo merchant specification used by retail card/POS terminals.", "INFO", 0));
        } else if (isStandardUpi) {
            // Standard upi://pay format
        } else if (payload.matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z0-9]{2,64}$")) {
            result.payeeVpa = payload;
            result.indicators.add(new IndicatorDetail("RAW_VPA", "Direct VPA Handle",
                    "QR contains a plain UPI ID without standard payment metadata.", "INFO", 5));
            score += 5;
        } else if (isWebLink) {
            result.indicators.add(new IndicatorDetail("WEB_LINK_QR", "Web URL Payment Redirect",
                    "This QR code points to a website link (" + (payload.length() > 50 ? payload.substring(0, 50) + "..." : payload) + ") rather than a native direct UPI scheme.", "MEDIUM", 25));
            score += 25;
        } else {
            result.indicators.add(new IndicatorDetail("NON_UPI_QR", "Non-Standard QR Scheme",
                    "This QR code does not use the official NPCI UPI protocol format (upi://pay).", "HIGH", 45));
            score += 45;
        }

        // 2. VPA Validation
        if (result.payeeVpa != null && !result.payeeVpa.isEmpty()) {
            String vpa = result.payeeVpa.toLowerCase();

            // Check if VPA format is valid
            if (!vpa.matches("^[a-zA-Z0-9.\\-_]+@[a-zA-Z0-9]+$")) {
                result.indicators.add(new IndicatorDetail("MALFORMED_VPA", "Malformed UPI ID",
                        "The UPI ID does not match standard virtual payment address formatting.", "HIGH", 35));
                score += 35;
            }

            // Check known scam reports
            if (scamReportRepository.isTargetReportedAsScam(vpa)) {
                result.indicators.add(new IndicatorDetail("REPORTED_VPA", "Reported Fraudulent UPI ID",
                        "This UPI ID has been reported by other users as involved in fraudulent activity.", "HIGH", 50));
                score += 50;
            }

            // Check scam keywords in VPA handle
            for (String kw : HIGH_RISK_KEYWORDS) {
                if (vpa.contains(kw.replace(" ", ""))) {
                    result.indicators.add(new IndicatorDetail("KEYWORD_IN_VPA", "Deceptive Keyword in UPI ID",
                            "The UPI ID contains deceptive term '" + kw + "' commonly used in impersonation scams.", "HIGH", 35));
                    score += 35;
                    break;
                }
            }

            // Payee Name vs VPA Mismatch check
            if (result.payeeName != null && !result.payeeName.isEmpty()) {
                String nameLower = result.payeeName.toLowerCase();
                for (String bank : BANK_AND_CORP_NAMES) {
                    if (nameLower.contains(bank)) {
                        // If payee name claims to be bank/utility, but VPA is personal (e.g. contains numbers/letters without official merchant handle)
                        boolean isPersonalHandle = vpa.matches(".*[0-9]{4,}.*") || vpa.contains("paytm") || vpa.contains("ybl") || vpa.contains("okaxis") || vpa.contains("ibl");
                        if (isPersonalHandle && !vpa.contains("official") && !vpa.contains("corp")) {
                            result.indicators.add(new IndicatorDetail("IMPERSONATION_MISMATCH", "Institutional Impersonation Detected",
                                    "The Payee Name claims to be '" + result.payeeName + "', but the receiving UPI ID is a personal account (" + result.payeeVpa + ").", "HIGH", 45));
                            score += 45;
                            break;
                        }
                    }
                }
            }
        } else if (payload.toLowerCase().startsWith("upi://pay")) {
            result.indicators.add(new IndicatorDetail("MISSING_VPA", "Missing Payee UPI ID",
                    "The QR code claims to be a UPI payment but is missing the mandatory payee address parameter.", "HIGH", 40));
            score += 40;
        }

        // 3. Amount & Collect Request Check
        if (result.amount != null && !result.amount.isEmpty()) {
            try {
                double amt = Double.parseDouble(result.amount);
                if (amt <= 0) {
                    result.indicators.add(new IndicatorDetail("ZERO_AMOUNT", "Zero or Negative Amount",
                            "The QR code specifies an invalid payment amount of " + amt, "MEDIUM", 20));
                    score += 20;
                } else if (amt >= 20000) {
                    result.indicators.add(new IndicatorDetail("HIGH_VALUE_QR", "High Value Transaction Requested",
                            "This QR code is pre-configured to transfer a significant amount: ₹" + amt, "MEDIUM", 15));
                    score += 15;
                }
            } catch (NumberFormatException ignored) {}
        }

        // 4. Transaction Note / Description Analysis
        if (result.transactionNote != null && !result.transactionNote.isEmpty()) {
            String noteLower = result.transactionNote.toLowerCase();
            if (noteLower.contains("receive") || noteLower.contains("credit") || noteLower.contains("claim") || noteLower.contains("accept")) {
                result.indicators.add(new IndicatorDetail("RECEIVE_MONEY_DECEPTION", "Critical: Fake 'Receive Money' QR Code",
                        "The note claims scanning this will receive or credit money. In UPI, scanning a QR code ALWAYS sends money out of your account, NEVER receives it!", "HIGH", 50));
                score += 50;
            }

            if (noteLower.contains("pin") || noteLower.contains("upi pin") || noteLower.contains("password")) {
                result.indicators.add(new IndicatorDetail("PIN_HARVESTING_ATTEMPT", "UPI PIN Reference in QR Payload",
                        "The transaction note mentions entering a PIN. You NEVER need to enter your UPI PIN to receive money.", "HIGH", 50));
                score += 50;
            }

            for (String kw : HIGH_RISK_KEYWORDS) {
                if (noteLower.contains(kw)) {
                    result.indicators.add(new IndicatorDetail("SUSPICIOUS_NOTE", "Suspicious Keyword in Transaction Note",
                            "The note contains suspicious lure word: '" + kw + "'.", "MEDIUM", 20));
                    score += 20;
                    break;
                }
            }
        }

        // Cap score at 100
        result.score = Math.min(100, score);

        // Generate Human-Language Explanation and Actionable Recommendations
        if (result.score >= 65) {
            result.explanation = "HIGH RISK: Strong indicators of a fraudulent UPI transaction. " +
                    (result.indicators.stream().anyMatch(i -> i.getId().equals("RECEIVE_MONEY_DECEPTION"))
                            ? "This QR is designed to deceive you into transferring money while falsely claiming you are receiving a payment. "
                            : "The payee identity does not match legitimate organization standards or has been reported as suspicious. ") +
                    "Remember: Scanning a QR code or entering your UPI PIN ALWAYS transfers money FROM your bank account.";

            result.recommendations.add("DO NOT scan this QR code or authorize payment in your UPI app.");
            result.recommendations.add("Never enter your UPI PIN to claim refunds, prizes, or cashbacks.");
            result.recommendations.add("Report this QR code to the National Cyber Crime portal (1930) or local authorities.");
        } else if (result.score >= 30) {
            result.explanation = "MEDIUM RISK: Caution required. The QR payload contains unusual parameters or mismatched merchant identity details. Verify the receiver before sending any funds.";
            result.recommendations.add("Carefully verify the payee name and UPI ID in your banking app before proceeding.");
            result.recommendations.add("Never proceed if the sender asks you to enter your PIN to 'receive' money.");
            result.recommendations.add("Contact the merchant or person directly via their verified official number.");
        } else {
            result.explanation = "LOW RISK: The QR code conforms to standard NPCI UPI specifications with no obvious fraud patterns detected. Always double-check the recipient name on your banking screen.";
            result.recommendations.add("Review the final payee name and amount on your UPI app's payment confirmation screen.");
            result.recommendations.add("Ensure the payee matches who you intended to pay.");
        }

        return result;
    }

    private Map<String, String> parseUpiUri(String uri) {
        Map<String, String> params = new HashMap<>();
        try {
            int qIdx = uri.indexOf('?');
            if (qIdx != -1 && qIdx < uri.length() - 1) {
                String query = uri.substring(qIdx + 1);
                String[] pairs = query.split("&");
                for (String pair : pairs) {
                    String[] kv = pair.split("=", 2);
                    if (kv.length == 2) {
                        String key = safeUrlDecode(kv[0]).trim().toLowerCase();
                        String val = safeUrlDecode(kv[1]).trim();
                        params.put(key, val);
                    }
                }
            }
        } catch (Exception ignored) {}
        return params;
    }

    private String safeUrlDecode(String s) {
        if (s == null) return "";
        try {
            return URLDecoder.decode(s, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return s.replace("+", " ");
        }
    }

    private void parseBharatQr(String payload, QrEvaluationResult result) {
        try {
            int i = 0;
            while (i + 4 <= payload.length()) {
                String tag = payload.substring(i, i + 2);
                int length = Integer.parseInt(payload.substring(i + 2, i + 4));
                i += 4;
                if (i + length > payload.length()) break;
                String val = payload.substring(i, i + length);
                i += length;

                if (tag.equals("59") && (result.payeeName == null || result.payeeName.isEmpty())) {
                    result.payeeName = val;
                } else if (tag.equals("54") && (result.amount == null || result.amount.isEmpty())) {
                    result.amount = val;
                } else if ((tag.equals("26") || tag.equals("27")) && (result.payeeVpa == null || result.payeeVpa.isEmpty())) {
                    // Extract VPA from EMVCo Sub-template if present
                    int atIdx = val.indexOf('@');
                    if (atIdx != -1) {
                        int start = Math.max(0, val.lastIndexOf("01", atIdx) + 2);
                        String sub = val.substring(start);
                        int end = sub.indexOf("02");
                        result.payeeVpa = end != -1 ? sub.substring(0, end) : sub;
                    }
                }
            }
        } catch (Exception ignored) {}
    }
}
