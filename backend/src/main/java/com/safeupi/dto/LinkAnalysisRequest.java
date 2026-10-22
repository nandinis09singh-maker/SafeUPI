package com.safeupi.dto;

import jakarta.validation.constraints.NotBlank;

public class LinkAnalysisRequest {

    @NotBlank(message = "URL is required")
    private String url;

    public LinkAnalysisRequest() {}

    public LinkAnalysisRequest(String url) {
        this.url = url;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
