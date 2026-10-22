package com.safeupi;

import com.safeupi.model.RiskLevel;
import com.safeupi.model.ScanHistory;
import com.safeupi.model.ScanType;
import com.safeupi.model.ScamIndicator;
import com.safeupi.model.ScamReport;
import com.safeupi.model.TrustedContact;
import com.safeupi.model.User;
import com.safeupi.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class SafeUpiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SafeUpiApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository,
                                          ScanHistoryRepository scanHistoryRepository,
                                          TrustedContactRepository trustedContactRepository,
                                          ScamReportRepository scamReportRepository,
                                          ScamIndicatorRepository scamIndicatorRepository,
                                          PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Demo User if not present
            User demoUser = userRepository.findByUsername("demo").orElse(null);
            if (demoUser == null) {
                demoUser = new User(
                        "demo",
                        "demo@safeupi.com",
                        passwordEncoder.encode("SafeUPI@123"),
                        "Rajesh Sharma"
                );
                demoUser = userRepository.save(demoUser);

                // Seed Trusted Contacts
                trustedContactRepository.save(new TrustedContact(
                        demoUser, "Priya Sharma (Wife)", "+91 9876543210", "Spouse", "priya@example.com"
                ));
                trustedContactRepository.save(new TrustedContact(
                        demoUser, "Amit Kumar (Brother)", "+91 9811223344", "Sibling", "amit@example.com"
                ));

                // Seed Sample History
                ScanHistory h1 = new ScanHistory();
                h1.setUser(demoUser);
                h1.setScanType(ScanType.QR);
                h1.setRawInput("upi://pay?pa=refund-desk-8899@paytm&pn=Electricity%20Bill%20Refund&am=4500&cu=INR&tn=Scan%20to%20receive%20refund");
                h1.setRiskLevel(RiskLevel.HIGH);
                h1.setRiskScore(95);
                h1.setPayeeVpa("refund-desk-8899@paytm");
                h1.setPayeeName("Electricity Bill Refund");
                h1.setAmount("4500");
                h1.setExplanation("HIGH RISK: Fake 'Receive Money' QR code detected with personal VPA masquerading as electricity utility.");
                h1.setIndicatorsJson("[{\"id\":\"RECEIVE_MONEY_DECEPTION\",\"title\":\"Critical: Fake 'Receive Money' QR Code\",\"description\":\"The note claims scanning this will receive or credit money. In UPI, scanning a QR code ALWAYS sends money out of your account, NEVER receives it!\",\"severity\":\"HIGH\",\"weight\":50},{\"id\":\"IMPERSONATION_MISMATCH\",\"title\":\"Institutional Impersonation Detected\",\"description\":\"The Payee Name claims to be 'Electricity Bill Refund', but the receiving UPI ID is a personal account.\",\"severity\":\"HIGH\",\"weight\":45}]");
                h1.setRecommendationsJson("[\"DO NOT scan this QR code or authorize payment in your UPI app.\",\"Never enter your UPI PIN to claim refunds, prizes, or cashbacks.\",\"Report this QR code to the National Cyber Crime portal (1930).\"]");
                scanHistoryRepository.save(h1);

                ScanHistory h2 = new ScanHistory();
                h2.setUser(demoUser);
                h2.setScanType(ScanType.MESSAGE);
                h2.setRawInput("Dear customer, your electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer Mr. Verma at 9871234567 to update immediately.");
                h2.setRiskLevel(RiskLevel.HIGH);
                h2.setRiskScore(85);
                h2.setExplanation("HIGH RISK: Fake Electricity Disconnection Scam threatening immediate power cutoff.");
                h2.setIndicatorsJson("[{\"id\":\"ELECTRICITY_SCAM\",\"title\":\"Fake Electricity Disconnection Scam\",\"description\":\"Classic Indian utility scam: fake urgent warning threatening immediate power cutoff tonight.\",\"severity\":\"HIGH\",\"weight\":40},{\"id\":\"PERSONAL_HELPLINE\",\"title\":\"Personal Number Impersonating Helpdesk\",\"description\":\"Message provides a personal 10-digit mobile number masquerading as official officer.\",\"severity\":\"HIGH\",\"weight\":35}]");
                h2.setRecommendationsJson("[\"DO NOT call the personal mobile number.\",\"Verify bill status only through your official electricity utility app.\",\"Forward fraudulent SMS to 1909.\"]");
                scanHistoryRepository.save(h2);

                ScanHistory h3 = new ScanHistory();
                h3.setUser(demoUser);
                h3.setScanType(ScanType.LINK);
                h3.setRawInput("https://sbi-kyc-pan-update.top/login.html");
                h3.setRiskLevel(RiskLevel.HIGH);
                h3.setRiskScore(90);
                h3.setExplanation("HIGH RISK: Phishing link impersonating State Bank of India using high-risk .top domain extension.");
                h3.setIndicatorsJson("[{\"id\":\"BRAND_IMPERSONATION\",\"title\":\"Brand Impersonation / Fake Domain\",\"description\":\"The domain contains 'SBI' but is not an authorized official portal.\",\"severity\":\"HIGH\",\"weight\":50},{\"id\":\"SUSPICIOUS_TLD\",\"title\":\"High-Risk Domain Extension (.top)\",\"description\":\"Uses disposable domain extension frequently favored by phishing scammers.\",\"severity\":\"MEDIUM\",\"weight\":25}]");
                h3.setRecommendationsJson("[\"DO NOT open or visit this link.\",\"Never enter net banking credentials on unauthorized sites.\",\"Delete or report the message.\"]");
                scanHistoryRepository.save(h3);

                ScanHistory h4 = new ScanHistory();
                h4.setUser(demoUser);
                h4.setScanType(ScanType.QR);
                h4.setRawInput("upi://pay?pa=store@okicici&pn=Reliance%20Fresh%20Store&am=340.50&cu=INR&tn=Grocery%20Order%209912");
                h4.setRiskLevel(RiskLevel.LOW);
                h4.setRiskScore(0);
                h4.setPayeeVpa("store@okicici");
                h4.setPayeeName("Reliance Fresh Store");
                h4.setAmount("340.50");
                h4.setExplanation("LOW RISK: Standard merchant UPI QR code without deceptive keywords or flags.");
                h4.setIndicatorsJson("[]");
                h4.setRecommendationsJson("[\"Review the final payee name and amount on your UPI app's payment confirmation screen.\"]");
                scanHistoryRepository.save(h4);
            }

            // Seed Known Scam Indicators if empty
            if (scamIndicatorRepository.count() == 0) {
                scamIndicatorRepository.save(new ScamIndicator("VPA", "refund-desk-8899@paytm", "REFUND_FRAUD", 50, "Fake electricity & courier refund scam VPA"));
                scamIndicatorRepository.save(new ScamIndicator("VPA", "kbc.lottery.winner@okaxis", "LOTTERY", 50, "KBC lottery impersonation scam"));
                scamIndicatorRepository.save(new ScamIndicator("VPA", "phonepe.cashback.claim@ybl", "CASHBACK", 50, "Deceptive PhonePe reward claim handle"));
                scamIndicatorRepository.save(new ScamIndicator("DOMAIN", "sbi-kyc-pan-update.top", "PHISHING", 50, "Fake SBI netbanking phishing portal"));
                scamIndicatorRepository.save(new ScamIndicator("DOMAIN", "paytm-cashback-reward.xyz", "PHISHING", 50, "Fake reward page stealing UPI credentials"));
                scamIndicatorRepository.save(new ScamIndicator("KEYWORD", "pin to receive", "PIN_THEFT", 50, "Claiming UPI PIN is required to receive money"));
            }

            // Seed Sample Community Scam Reports if empty
            if (scamReportRepository.count() == 0) {
                ScamReport r1 = new ScamReport();
                r1.setUser(demoUser);
                r1.setReportType("UPI_ID");
                r1.setTargetValue("refund-desk-8899@paytm");
                r1.setDescription("Caller claimed to be from Mahadiscom electricity board asking to scan QR for Rs 200 excess bill refund.");
                r1.setReporterContact("+91 9876543210");
                r1.setStatus("CONFIRMED_COMMUNITY_REPORT");
                scamReportRepository.save(r1);

                ScamReport r2 = new ScamReport();
                r2.setUser(demoUser);
                r2.setReportType("LINK");
                r2.setTargetValue("https://sbi-kyc-pan-update.top");
                r2.setDescription("Received SMS stating SBI account will be blocked unless PAN is updated on this link.");
                r2.setReporterContact("+91 9811223344");
                r2.setStatus("CONFIRMED_COMMUNITY_REPORT");
                scamReportRepository.save(r2);
            }
        };
    }
}
