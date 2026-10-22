package com.safeupi.service.engine;

import com.safeupi.dto.AnalysisResponse;
import com.safeupi.model.RiskLevel;
import com.safeupi.model.ScanType;
import org.springframework.stereotype.Service;

@Service
public class RiskRulesEngine {

    private final QrRuleEvaluator qrRuleEvaluator;
    private final MessageRuleEvaluator messageRuleEvaluator;
    private final LinkRuleEvaluator linkRuleEvaluator;

    public RiskRulesEngine(QrRuleEvaluator qrRuleEvaluator,
                           MessageRuleEvaluator messageRuleEvaluator,
                           LinkRuleEvaluator linkRuleEvaluator) {
        this.qrRuleEvaluator = qrRuleEvaluator;
        this.messageRuleEvaluator = messageRuleEvaluator;
        this.linkRuleEvaluator = linkRuleEvaluator;
    }

    public AnalysisResponse analyzeQr(String payload) {
        QrRuleEvaluator.QrEvaluationResult res = qrRuleEvaluator.evaluate(payload);
        AnalysisResponse response = new AnalysisResponse();
        response.setScanType(ScanType.QR);
        response.setRiskScore(res.score);
        response.setRiskLevel(deriveLevel(res.score));
        response.setPayeeVpa(res.payeeVpa);
        response.setPayeeName(res.payeeName);
        response.setAmount(res.amount);
        response.setTransactionNote(res.transactionNote);
        response.setIndicators(res.indicators);
        response.setRecommendations(res.recommendations);
        response.setExplanation(res.explanation);
        response.setVoiceWarning(generateVoiceWarnings(response.getRiskLevel(), ScanType.QR));
        return response;
    }

    public AnalysisResponse analyzeMessage(String message, String senderId) {
        MessageRuleEvaluator.MessageEvaluationResult res = messageRuleEvaluator.evaluate(message, senderId);
        AnalysisResponse response = new AnalysisResponse();
        response.setScanType(ScanType.MESSAGE);
        response.setRiskScore(res.score);
        response.setRiskLevel(deriveLevel(res.score));
        response.setTargetUrl(res.extractedLink);
        response.setIndicators(res.indicators);
        response.setRecommendations(res.recommendations);
        response.setExplanation(res.explanation);
        response.setVoiceWarning(generateVoiceWarnings(response.getRiskLevel(), ScanType.MESSAGE));
        return response;
    }

    public AnalysisResponse analyzeLink(String url) {
        LinkRuleEvaluator.LinkEvaluationResult res = linkRuleEvaluator.evaluate(url);
        AnalysisResponse response = new AnalysisResponse();
        response.setScanType(ScanType.LINK);
        response.setRiskScore(res.score);
        response.setRiskLevel(deriveLevel(res.score));
        response.setTargetUrl(url);
        response.setIndicators(res.indicators);
        response.setRecommendations(res.recommendations);
        response.setExplanation(res.explanation);
        response.setVoiceWarning(generateVoiceWarnings(response.getRiskLevel(), ScanType.LINK));
        return response;
    }

    private RiskLevel deriveLevel(int score) {
        if (score >= 65) {
            return RiskLevel.HIGH;
        } else if (score >= 30) {
            return RiskLevel.MEDIUM;
        } else {
            return RiskLevel.LOW;
        }
    }

    private AnalysisResponse.VoiceWarningDto generateVoiceWarnings(RiskLevel level, ScanType type) {
        if (level == RiskLevel.HIGH) {
            String eng = (type == ScanType.QR)
                    ? "Warning! High risk QR code detected. Do not scan or enter your UPI PIN. Entering a UPI PIN always sends money from your account!"
                    : (type == ScanType.MESSAGE)
                    ? "Alert! High risk fraud message detected. Never enter your UPI PIN to receive money, and do not share OTPs."
                    : "Danger! Phishing link detected. Do not click or enter any bank credentials.";

            String hin = (type == ScanType.QR)
                    ? "चेतावनी! उच्च जोखिम वाला क्यूआर कोड पाया गया है। कृपया अपना यूपीआई पिन न डालें। यूपीआई पिन डालने से हमेशा पैसे कटते हैं!"
                    : (type == ScanType.MESSAGE)
                    ? "सावधान! धोखाधड़ी वाला संदेश पाया गया है। पैसे प्राप्त करने के लिए कभी भी यूपीआई पिन न डालें और ओटीपी साझा न करें।"
                    : "खतरा! फर्जी वेबसाइट का लिंक पाया गया है। इस लिंक पर क्लिक न करें।";

            String mar = (type == ScanType.QR)
                    ? "सावधान! फसवणुकीचा मोठा धोका आढळला आहे. आपला यूपीआय पिन कधीही टाकू नका. यूपीआय पिन टाकल्याने खात्यातून पैसे कापले जातात!"
                    : (type == ScanType.MESSAGE)
                    ? "धोका! संशयास्पद संदेश आढळला आहे. पैसे मिळवण्यासाठी कधीही यूपीआय पिन किंवा ओटीपी शेअर करू नका."
                    : "सावधान! संशयास्पद लिंक आढळली आहे. कोणतीही माहिती भरू नका.";

            return new AnalysisResponse.VoiceWarningDto(eng, hin, mar);
        } else if (level == RiskLevel.MEDIUM) {
            return new AnalysisResponse.VoiceWarningDto(
                    "Caution! Suspicious indicators detected. Please verify the payee and sender details carefully before proceeding.",
                    "सावधान! संदिग्ध गतिविधियां पाई गई हैं। कृपया आगे बढ़ने से पहले विवरण की पुष्टि करें।",
                    "काळजी घ्या! संशयास्पद माहिती आढळली आहे. व्यवहार करण्यापूर्वी खात्री करा."
            );
        } else {
            return new AnalysisResponse.VoiceWarningDto(
                    "Analysis complete. Low risk detected. Always verify recipient details before sending funds.",
                    "जांच पूरी हुई। कोई धोखाधड़ी के संकेत नहीं मिले। भुगतान से पहले विवरण जांचें।",
                    "तपासणी पूर्ण झाली. कोणताही धोका आढळला नाही. व्यवहार करण्यापूर्वी माहिती तपासा."
            );
        }
    }
}
