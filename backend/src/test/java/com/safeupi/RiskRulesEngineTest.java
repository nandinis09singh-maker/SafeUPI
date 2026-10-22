package com.safeupi;

import com.safeupi.dto.AnalysisResponse;
import com.safeupi.model.RiskLevel;
import com.safeupi.repository.ScamIndicatorRepository;
import com.safeupi.repository.ScamReportRepository;
import com.safeupi.service.engine.LinkRuleEvaluator;
import com.safeupi.service.engine.MessageRuleEvaluator;
import com.safeupi.service.engine.QrRuleEvaluator;
import com.safeupi.service.engine.RiskRulesEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

public class RiskRulesEngineTest {

    private RiskRulesEngine rulesEngine;
    private ScamReportRepository scamReportRepository;
    private ScamIndicatorRepository scamIndicatorRepository;

    @BeforeEach
    public void setup() {
        scamReportRepository = Mockito.mock(ScamReportRepository.class);
        scamIndicatorRepository = Mockito.mock(ScamIndicatorRepository.class);

        when(scamReportRepository.isTargetReportedAsScam(anyString())).thenReturn(false);

        QrRuleEvaluator qrEvaluator = new QrRuleEvaluator(scamReportRepository, scamIndicatorRepository);
        MessageRuleEvaluator msgEvaluator = new MessageRuleEvaluator(scamIndicatorRepository);
        LinkRuleEvaluator linkEvaluator = new LinkRuleEvaluator(scamReportRepository, scamIndicatorRepository);

        rulesEngine = new RiskRulesEngine(qrEvaluator, msgEvaluator, linkEvaluator);
    }

    @Test
    public void testHighRiskQrScanToReceive() {
        String payload = "upi://pay?pa=scammer99@paytm&pn=Electricity%20Department&am=3500&cu=INR&tn=Scan%20to%20receive%20refund";
        AnalysisResponse res = rulesEngine.analyzeQr(payload);

        assertEquals(RiskLevel.HIGH, res.getRiskLevel());
        assertTrue(res.getRiskScore() >= 65);
        assertTrue(res.getIndicators().stream().anyMatch(i -> i.getId().equals("RECEIVE_MONEY_DECEPTION")));
    }

    @Test
    public void testCleanMerchantQr() {
        String payload = "upi://pay?pa=store@okicici&pn=Reliance%20Retail&am=250&cu=INR&tn=Order123";
        AnalysisResponse res = rulesEngine.analyzeQr(payload);

        assertEquals(RiskLevel.LOW, res.getRiskLevel());
        assertTrue(res.getRiskScore() < 30);
    }

    @Test
    public void testMessageWithUpiPinScam() {
        String message = "Dear User, Rs 4000 approved cashback. Enter your UPI PIN to receive money in your account now.";
        AnalysisResponse res = rulesEngine.analyzeMessage(message, "9876543210");

        assertEquals(RiskLevel.HIGH, res.getRiskLevel());
        assertTrue(res.getIndicators().stream().anyMatch(i -> i.getId().equals("UPI_PIN_SCAM")));
    }

    @Test
    public void testPhishingLink() {
        String url = "https://sbi-online-kyc.top/verify.php";
        AnalysisResponse res = rulesEngine.analyzeLink(url);

        assertEquals(RiskLevel.HIGH, res.getRiskLevel());
        assertTrue(res.getIndicators().stream().anyMatch(i -> i.getId().equals("BRAND_IMPERSONATION")));
    }
}
