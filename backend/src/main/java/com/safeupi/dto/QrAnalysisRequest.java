package com.safeupi.dto;

import jakarta.validation.constraints.NotBlank;

public class QrAnalysisRequest {

    @NotBlank(message = "QR payload or UPI URI is required")
    private String payload;

    public QrAnalysisRequest() {}

    public QrAnalysisRequest(String payload) {
        this.payload = payload;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }
}
