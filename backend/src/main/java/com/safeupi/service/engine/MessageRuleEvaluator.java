package com.safeupi.service.engine;

import com.safeupi.dto.IndicatorDetail;
import com.safeupi.repository.ScamIndicatorRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MessageRuleEvaluator {

    private final ScamIndicatorRepository scamIndicatorRepository;

    public MessageRuleEvaluator(ScamIndicatorRepository scamIndicatorRepository) {
        this.scamIndicatorRepository = scamIndicatorRepository;
    }

    public static class MessageEvaluationResult {
        public int score;
        public List<IndicatorDetail> indicators = new ArrayList<>();
        public List<String> recommendations = new ArrayList<>();
        public String explanation;
        public String extractedLink;
        public String extractedContact;
    }

    public MessageEvaluationResult evaluate(String rawMessage, String senderId) {
        MessageEvaluationResult result = new MessageEvaluationResult();
        int score = 0;

        if (rawMessage == null || rawMessage.trim().isEmpty()) {
            result.score = 75;
            result.indicators.add(new IndicatorDetail("EMPTY_MSG", "Empty Message",
                    "The provided message is empty.", "MEDIUM", 75));
            result.explanation = "Message text is empty.";
            return result;
        }

        String message = rawMessage.trim();
        String lowerMsg = message.toLowerCase();

        // 1. Critical UPI PIN Scam Pattern
        Pattern pinPattern = Pattern.compile("(enter|input|share|type|put)\\s+(your\\s+)?(upi\\s*pin|mpin|4-digit\\s*pin|6-digit\\s*pin|secret\\s*pin)\\s+(to|for)?\\s*(receive|credit|accept|claim|get)", Pattern.CASE_INSENSITIVE);
        if (pinPattern.matcher(message).find() || lowerMsg.contains("pin to receive") || lowerMsg.contains("enter pin to get") || lowerMsg.contains("pin dalo paise aayenge") || lowerMsg.contains("pin taka")) {
            result.indicators.add(new IndicatorDetail("UPI_PIN_SCAM", "Critical Fraud: UPI PIN Requested to Receive Funds",
                    "Message instructs you to enter a UPI PIN to receive money. This is a classic scam: entering your UPI PIN ALWAYS transfers money OUT of your account, NEVER into it!", "HIGH", 50));
            score += 50;
        }

        // 2. Collect Request Trap Pattern
        if (lowerMsg.contains("collect request") || lowerMsg.contains("approve request") || lowerMsg.contains("accept request") ||
                lowerMsg.contains("pay request") && (lowerMsg.contains("receive") || lowerMsg.contains("refund") || lowerMsg.contains("cashback"))) {
            result.indicators.add(new IndicatorDetail("COLLECT_REQUEST_TRAP", "Collect Request Trap",
                    "Message asks you to accept or approve a payment request in UPI apps (GPay, PhonePe, Paytm) under the pretense of receiving money.", "HIGH", 45));
            score += 45;
        }

        // 3. OTP & Screen Sharing App Theft
        if (lowerMsg.contains("share otp") || lowerMsg.contains("send otp") || lowerMsg.contains("forward otp") ||
                lowerMsg.contains("tell 6-digit") || lowerMsg.contains("forward sms to")) {
            result.indicators.add(new IndicatorDetail("OTP_THEFT", "OTP Theft Solicitation",
                    "Message asks you to forward or disclose a one-time password (OTP). Official financial institutions never ask for your OTP.", "HIGH", 45));
            score += 45;
        }

        if (lowerMsg.contains("anydesk") || lowerMsg.contains("quicksupport") || lowerMsg.contains("teamviewer") ||
                lowerMsg.contains("rustdesk") || lowerMsg.contains("screenshare") || lowerMsg.contains("screen share")) {
            result.indicators.add(new IndicatorDetail("REMOTE_ACCESS_APP", "Remote Screen-Sharing App Coercion",
                    "Scammers frequently ask victims to install remote access apps (AnyDesk, QuickSupport) to take over device screens and steal banking credentials.", "HIGH", 45));
            score += 45;
        }

        // 4. Urgency & Disconnection / Blocking Threats (Electricity, Bank, SIM)
        if (lowerMsg.contains("electricity will be disconnected") || lowerMsg.contains("power disconnected") ||
                lowerMsg.contains("bill overdue") || lowerMsg.contains("line will be cut") || lowerMsg.contains("bijli kat di jayegi")) {
            result.indicators.add(new IndicatorDetail("ELECTRICITY_SCAM", "Fake Electricity Disconnection Scam",
                    "Classic Indian utility scam: fake urgent warning threatening immediate power cutoff tonight unless a phone number is called or link clicked.", "HIGH", 40));
            score += 40;
        }

        if (lowerMsg.contains("account suspended") || lowerMsg.contains("account blocked") || lowerMsg.contains("kyc expired") ||
                lowerMsg.contains("pan not updated") || lowerMsg.contains("sim blocked within") || lowerMsg.contains("sim deactivation")) {
            result.indicators.add(new IndicatorDetail("URGENCY_THREAT", "Coercive Urgency & Account Freeze Threat",
                    "Message exploits fear by claiming your bank account, PAN, or SIM card will be deactivated immediately unless you take urgent action.", "HIGH", 35));
            score += 35;
        }

        // 5. Lottery, Prize, Lucky Draw, Part-Time Job Lures
        if (lowerMsg.contains("won rs") || lowerMsg.contains("won inr") || lowerMsg.contains("lottery") ||
                lowerMsg.contains("kbc") || lowerMsg.contains("lucky winner") || lowerMsg.contains("flipkart lucky draw") ||
                lowerMsg.contains("daily 2000-5000") || lowerMsg.contains("youtube like job") || lowerMsg.contains("part time telegram job")) {
            result.indicators.add(new IndicatorDetail("LOTTERY_JOB_LURE", "Unsolicited Prize / Task Job Scam",
                    "Promises unexpected lottery prizes or easy daily part-time tasks. These are bait to make you pay upfront processing or verification fees.", "HIGH", 35));
            score += 35;
        }

        // 6. Suspicious Customer Care Numbers
        Pattern phonePattern = Pattern.compile("(\\+91[\\-\\s]?)?[6-9]\\d{9}");
        Matcher phoneMatcher = phonePattern.matcher(message);
        if (phoneMatcher.find()) {
            result.extractedContact = phoneMatcher.group();
            if (lowerMsg.contains("officer") || lowerMsg.contains("manager") || lowerMsg.contains("customer care") ||
                    lowerMsg.contains("helpline") || lowerMsg.contains("support desk") || lowerMsg.contains("call immediately")) {
                result.indicators.add(new IndicatorDetail("PERSONAL_HELPLINE", "Personal Number Impersonating Helpdesk",
                    "Message provides a personal 10-digit mobile number (" + result.extractedContact + ") masquerading as an official bank or company helpline.", "HIGH", 35));
                score += 35;
            }
        }

        // 7. Embedded Links / APK Downloads
        Pattern urlPattern = Pattern.compile("(https?://[^\\s]+|www\\.[^\\s]+|[a-zA-Z0-9.\\-]+\\.(xyz|top|site|club|buzz|info|click|live|work|me|link)[^\\s]*)");
        Matcher urlMatcher = urlPattern.matcher(message);
        if (urlMatcher.find()) {
            result.extractedLink = urlMatcher.group();
            String linkLower = result.extractedLink.toLowerCase();

            if (linkLower.endsWith(".apk") || linkLower.contains(".apk?")) {
                result.indicators.add(new IndicatorDetail("MALICIOUS_APK", "Malicious Android APK Link",
                        "Message contains a link to download an unofficial APK application. Installing third-party APKs can hijack SMS and UPI credentials.", "HIGH", 50));
                score += 50;
            } else if (linkLower.contains("bit.ly") || linkLower.contains("tinyurl") || linkLower.contains("is.gd") || linkLower.contains("cutt.ly")) {
                result.indicators.add(new IndicatorDetail("SHORTENED_URL", "Masked / Shortened Link",
                        "Contains a shortened URL (" + result.extractedLink + ") hiding the true destination web page.", "MEDIUM", 25));
                score += 25;
            } else {
                result.indicators.add(new IndicatorDetail("EMBEDDED_LINK", "External Link in Security Message",
                        "Message includes an external link (" + result.extractedLink + "). Legitimate banks never send links to update KYC or enter credentials.", "MEDIUM", 20));
                score += 20;
            }
        }

        // 8. Sender ID Evaluation
        if (senderId != null && !senderId.trim().isEmpty()) {
            String s = senderId.trim().toUpperCase();
            // Official Indian transactional SMS headers look like "VM-HDFCBK", "AD-SBIINB", "BZ-PAYTM"
            boolean hasOfficialFormat = s.matches("^[A-Z]{2}-[A-Z0-9]{5,8}$") || s.matches("^[0-9A-Z]{6}$");
            if (!hasOfficialFormat && s.matches("^[6-9][0-9]{9}$")) {
                if (score > 0) {
                    result.indicators.add(new IndicatorDetail("PERSONAL_SENDER_SMS", "Sent from Personal Mobile Number",
                            "Security and financial alerts never originate from ordinary personal 10-digit mobile numbers (" + s + ").", "HIGH", 25));
                    score += 25;
                }
            }
        }

        result.score = Math.min(100, score);

        // Generate Explanation and Recommendations
        if (result.score >= 65) {
            result.explanation = "HIGH RISK: This message exhibits classic financial fraud characteristics. " +
                    (result.indicators.stream().anyMatch(i -> i.getId().equals("UPI_PIN_SCAM"))
                            ? "CRITICAL WARNING: The sender wants you to enter your UPI PIN. UPI PIN is solely used for deducting money from your account. You NEVER enter a PIN to receive funds! "
                            : "The message attempts to manipulate you using false urgency, fake utility disconnection, or fraudulent claims. ") +
                    "Do NOT click any links, do NOT call the provided number, and do NOT install remote support apps.";

            result.recommendations.add("DO NOT click any links or download APK files from this message.");
            result.recommendations.add("NEVER enter your UPI PIN to receive or claim any payment.");
            result.recommendations.add("Do NOT install remote desktop apps like AnyDesk, TeamViewer, or QuickSupport.");
            result.recommendations.add("Block and report the sender immediately in your SMS/WhatsApp app.");
            result.recommendations.add("Forward fraudulent SMS to 1909 (Do Not Disturb reporting) or report to cybercrime.gov.in (Helpline: 1930).");
        } else if (result.score >= 30) {
            result.explanation = "MEDIUM RISK: This message contains potentially misleading content or unverified external links. Verify claims directly with your service provider using their official app or website.";
            result.recommendations.add("Do not click links inside unsolicited SMS or WhatsApp messages.");
            result.recommendations.add("Verify electricity or banking status only through official utility apps.");
            result.recommendations.add("Never share OTPs, card numbers, or passwords with anyone.");
        } else {
            result.explanation = "LOW RISK: No prominent scam indicators were detected in this message. However, continue practicing standard safety: never disclose OTPs or enter UPI PINs on unknown prompts.";
            result.recommendations.add("Ensure the sender is an authorized contact before taking any payment action.");
            result.recommendations.add("Never share your banking passwords or OTPs under any circumstances.");
        }

        return result;
    }
}
