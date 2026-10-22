package com.safeupi.service.engine;

import com.safeupi.dto.IndicatorDetail;
import com.safeupi.repository.ScamIndicatorRepository;
import com.safeupi.repository.ScamReportRepository;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class LinkRuleEvaluator {

    private final ScamReportRepository scamReportRepository;
    private final ScamIndicatorRepository scamIndicatorRepository;

    private static final Set<String> HIGH_RISK_TLDS = Set.of(
            "xyz", "top", "site", "online", "club", "buzz", "work", "click", "icu", "fun",
            "info", "live", "rest", "cam", "fit", "monster", "cfd", "support"
    );

    private static final Set<String> SHORTENERS = Set.of(
            "bit.ly", "tinyurl.com", "is.gd", "cutt.ly", "rb.gy", "t.co", "ow.ly", "shorturl.at", "bl.ink"
    );

    private static final List<String> FINANCIAL_BRANDS = List.of(
            "sbi", "hdfc", "icici", "axis", "pnb", "paytm", "phonepe", "gpay", "googlepay",
            "bhim", "npci", "kotak", "incometax", "aadhaar", "uidai", "epfo", "digilocker",
            "mahadiscom", "tatapower", "bses"
    );

    private static final Pattern IP_PATTERN = Pattern.compile("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}(:\\d+)?$");

    public LinkRuleEvaluator(ScamReportRepository scamReportRepository,
                             ScamIndicatorRepository scamIndicatorRepository) {
        this.scamReportRepository = scamReportRepository;
        this.scamIndicatorRepository = scamIndicatorRepository;
    }

    public static class LinkEvaluationResult {
        public int score;
        public String parsedHost;
        public String scheme;
        public List<IndicatorDetail> indicators = new ArrayList<>();
        public List<String> recommendations = new ArrayList<>();
        public String explanation;
    }

    public LinkEvaluationResult evaluate(String rawUrl) {
        LinkEvaluationResult result = new LinkEvaluationResult();
        int score = 0;

        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            result.score = 75;
            result.indicators.add(new IndicatorDetail("EMPTY_URL", "Empty URL",
                    "No URL was provided for analysis.", "MEDIUM", 75));
            result.explanation = "URL is empty.";
            return result;
        }

        String urlString = rawUrl.trim();
        if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
            urlString = "http://" + urlString;
        }

        URI uri;
        try {
            uri = URI.create(urlString);
        } catch (Exception e) {
            result.score = 70;
            result.indicators.add(new IndicatorDetail("MALFORMED_URL", "Malformed URL Syntax",
                    "The provided link has invalid syntax or non-standard characters.", "HIGH", 70));
            result.explanation = "Malformed or unparseable link format.";
            result.recommendations.add("Do not click links with invalid web structure.");
            return result;
        }

        String host = uri.getHost();
        if (host == null || host.isEmpty()) {
            result.score = 70;
            result.indicators.add(new IndicatorDetail("NO_HOST", "Missing Hostname",
                    "The link does not specify a valid network host.", "HIGH", 70));
            result.explanation = "URL lacks a recognizable domain or host.";
            return result;
        }

        result.parsedHost = host;
        result.scheme = uri.getScheme();
        String hostLower = host.toLowerCase();
        String fullUrlLower = urlString.toLowerCase();

        // 1. IP Address Hostname
        if (IP_PATTERN.matcher(host).matches()) {
            result.indicators.add(new IndicatorDetail("RAW_IP_URL", "Direct IP Address Host",
                    "The link uses a raw numerical IP address (" + host + ") instead of a verified registered domain. Legitimate financial sites never use raw IP URLs.", "HIGH", 45));
            score += 45;
        }

        // 2. URL Shorteners
        for (String shortener : SHORTENERS) {
            if (hostLower.equals(shortener) || hostLower.endsWith("." + shortener)) {
                result.indicators.add(new IndicatorDetail("URL_SHORTENER", "URL Shortener Masking",
                        "The link uses a URL shortener service (" + host + "). Scammers use shorteners to conceal phishing domains and malware payloads.", "MEDIUM", 30));
                score += 30;
                break;
            }
        }

        // 3. Known Scam Reports Check
        if (scamReportRepository.isTargetReportedAsScam(urlString) || scamReportRepository.isTargetReportedAsScam(host)) {
            result.indicators.add(new IndicatorDetail("REPORTED_SCAM_LINK", "Reported Fraudulent Domain/URL",
                    "This domain or link has been flagged and reported by users for hosting phishing or scam content.", "HIGH", 50));
            score += 50;
        }

        // 4. Brand Impersonation & Typosquatting in Hostname
        for (String brand : FINANCIAL_BRANDS) {
            if (hostLower.contains(brand)) {
                // Check if it's the actual legitimate domain
                boolean isLegitimate = isOfficialBrandDomain(hostLower, brand);
                if (!isLegitimate) {
                    result.indicators.add(new IndicatorDetail("BRAND_IMPERSONATION", "Brand Impersonation / Fake Domain",
                            "The domain '" + host + "' contains the brand name '" + brand.toUpperCase() + "' but is not an authorized, official portal of this organization.", "HIGH", 50));
                    score += 50;
                    break;
                }
            }
        }

        // 5. High-Risk TLD (Top-Level Domain)
        String[] hostParts = hostLower.split("\\.");
        if (hostParts.length >= 2) {
            String tld = hostParts[hostParts.length - 1];
            if (HIGH_RISK_TLDS.contains(tld)) {
                result.indicators.add(new IndicatorDetail("SUSPICIOUS_TLD", "High-Risk Domain Extension (." + tld + ")",
                        "The link uses an inexpensive/disposable domain extension (." + tld + ") frequently favored by transient scam syndicates.", "MEDIUM", 25));
                score += 25;
            }

            // Misleading subdomains: e.g. sbi.co.in.scamsite.com
            if (hostParts.length > 3) {
                result.indicators.add(new IndicatorDetail("EXCESSIVE_SUBDOMAINS", "Excessive Subdomain Stacking",
                        "The host has multiple nested subdomains (" + host + "), often used to trick mobile users who only see the first part of a domain.", "MEDIUM", 25));
                score += 25;
            }
        }

        // 6. APK download in path
        String path = uri.getPath();
        if (path != null && (path.toLowerCase().endsWith(".apk") || fullUrlLower.contains(".apk?"))) {
            result.indicators.add(new IndicatorDetail("DIRECT_APK_LINK", "Direct Android APK Download",
                    "The link targets an executable APK file. Fraudsters distribute fake banking apps via direct APK downloads to bypass Google Play security.", "HIGH", 50));
            score += 50;
        }

        // 7. Non-HTTPS on financial / sensitive keywords
        if ("http".equalsIgnoreCase(result.scheme)) {
            if (fullUrlLower.contains("login") || fullUrlLower.contains("pay") || fullUrlLower.contains("bank") ||
                    fullUrlLower.contains("kyc") || fullUrlLower.contains("upi") || fullUrlLower.contains("refund")) {
                result.indicators.add(new IndicatorDetail("INSECURE_HTTP_PAYMENT", "Unencrypted HTTP Scheme on Sensitive Action",
                        "The link transmits credentials over insecure HTTP without TLS encryption.", "HIGH", 35));
                score += 35;
            } else {
                result.indicators.add(new IndicatorDetail("UNENCRYPTED_HTTP", "Unencrypted HTTP Link",
                        "The link uses unencrypted HTTP instead of modern HTTPS.", "LOW", 15));
                score += 15;
            }
        }

        // 8. Suspicious action keywords in path or query
        if (fullUrlLower.contains("kyc-update") || fullUrlLower.contains("pan-link") || fullUrlLower.contains("claim-cashback") ||
                fullUrlLower.contains("refund-verify") || fullUrlLower.contains("lottery-claim")) {
            result.indicators.add(new IndicatorDetail("SUSPICIOUS_PATH_KEYWORDS", "Lure Action in Link Path",
                    "The link path contains phrases designed to lure users into submitting personal or banking information.", "HIGH", 30));
            score += 30;
        }

        result.score = Math.min(100, score);

        // Explanations and Recommendations
        if (result.score >= 65) {
            result.explanation = "HIGH RISK: Strong phishing or malware threat. The domain '" + host + "' appears to mimic a legitimate service or uses deceptive hosting patterns to harvest bank credentials.";
            result.recommendations.add("DO NOT open or visit this link.");
            result.recommendations.add("Never input passwords, net-banking credentials, or UPI details on this webpage.");
            result.recommendations.add("Delete or report the message where you received this link.");
            result.recommendations.add("If you already visited it, change your banking passwords immediately and freeze affected accounts.");
        } else if (result.score >= 30) {
            result.explanation = "MEDIUM RISK: Caution warranted. The URL uses shortened redirection, atypical extensions, or unverified hosting. Exercise caution before proceeding.";
            result.recommendations.add("Verify the destination domain before entering any information.");
            result.recommendations.add("Prefer navigating to the official website directly from your browser's bookmarks or official apps.");
            result.recommendations.add("Ensure the browser shows a valid SSL certificate for the exact company name.");
        } else {
            result.explanation = "LOW RISK: The analyzed URL does not trigger known fraud heuristics or brand impersonation patterns. Always ensure you are on the intended organization's domain before transacting.";
            result.recommendations.add("Confirm that the domain belongs to the entity you intend to visit.");
            result.recommendations.add("Ensure the connection shows HTTPS with a valid certificate.");
        }

        return result;
    }

    private boolean isOfficialBrandDomain(String host, String brand) {
        // Known legitimate official domains
        return switch (brand) {
            case "sbi" -> host.endsWith(".sbi") || host.endsWith(".onlinesbi.sbi") || host.endsWith(".sbi.co.in") || host.equals("sbi.co.in");
            case "hdfc" -> host.endsWith(".hdfcbank.com") || host.endsWith(".hdfc.com");
            case "icici" -> host.endsWith(".icicibank.com") || host.endsWith(".icici.com");
            case "axis" -> host.endsWith(".axisbank.com");
            case "pnb" -> host.endsWith(".pnbindia.in");
            case "paytm" -> host.endsWith(".paytm.com") || host.endsWith(".paytmbank.com");
            case "phonepe" -> host.endsWith(".phonepe.com");
            case "gpay", "googlepay" -> host.endsWith(".google.com") || host.endsWith(".google.co.in");
            case "bhim", "npci" -> host.endsWith(".npci.org.in") || host.endsWith(".bhimupi.org.in");
            case "incometax" -> host.endsWith(".incometax.gov.in");
            case "aadhaar", "uidai" -> host.endsWith(".uidai.gov.in");
            case "epfo" -> host.endsWith(".epfindia.gov.in");
            case "digilocker" -> host.endsWith(".digilocker.gov.in");
            case "mahadiscom" -> host.endsWith(".mahadiscom.in");
            case "tatapower" -> host.endsWith(".tatapower.com");
            case "bses" -> host.endsWith(".bsesdelhi.com");
            default -> false;
        };
    }
}
