package com.safeupi.dto;

import jakarta.validation.constraints.NotBlank;

public class MessageAnalysisRequest {

    @NotBlank(message = "Message text is required")
    private String message;

    private String senderId; // optional SMS sender code or WhatsApp phone

    public MessageAnalysisRequest() {}

    public MessageAnalysisRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
}
