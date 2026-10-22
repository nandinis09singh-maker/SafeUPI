package com.safeupi.dto;

import com.safeupi.model.RiskLevel;
import com.safeupi.model.ScanType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AnalysisResponse {
    private Long historyId;
    private ScanType scanType;
    private RiskLevel riskLevel;
    private int riskScore;
    private String payeeVpa;
    private String payeeName;
    private String amount;
    private String transactionNote;
    private String targetUrl;
    private String explanation;
    private List<IndicatorDetail> indicators = new ArrayList<>();
    private List<String> recommendations = new ArrayList<>();
    private VoiceWarningDto voiceWarning;
    private LocalDateTime createdAt = LocalDateTime.now();

    public static class VoiceWarningDto {
        private String english;
        private String hindi;
        private String marathi;

        public VoiceWarningDto() {}

        public VoiceWarningDto(String english, String hindi, String marathi) {
            this.english = english;
            this.hindi = hindi;
            this.marathi = marathi;
        }

        public String getEnglish() {
            return english;
        }

        public void setEnglish(String english) {
            this.english = english;
        }

        public String getHindi() {
            return hindi;
        }

        public void setHindi(String hindi) {
            this.hindi = hindi;
        }

        public String getMarathi() {
            return marathi;
        }

        public void setMarathi(String marathi) {
            this.marathi = marathi;
        }
    }

    public AnalysisResponse() {}

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public ScanType getScanType() {
        return scanType;
    }

    public void setScanType(ScanType scanType) {
        this.scanType = scanType;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getPayeeVpa() {
        return payeeVpa;
    }

    public void setPayeeVpa(String payeeVpa) {
        this.payeeVpa = payeeVpa;
    }

    public String getPayeeName() {
        return payeeName;
    }

    public void setPayeeName(String payeeName) {
        this.payeeName = payeeName;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getTransactionNote() {
        return transactionNote;
    }

    public void setTransactionNote(String transactionNote) {
        this.transactionNote = transactionNote;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<IndicatorDetail> getIndicators() {
        return indicators;
    }

    public void setIndicators(List<IndicatorDetail> indicators) {
        this.indicators = indicators;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public VoiceWarningDto getVoiceWarning() {
        return voiceWarning;
    }

    public void setVoiceWarning(VoiceWarningDto voiceWarning) {
        this.voiceWarning = voiceWarning;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
