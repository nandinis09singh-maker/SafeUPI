package com.safeupi.dto;

import jakarta.validation.constraints.NotBlank;

public class ScamReportRequest {

    @NotBlank(message = "Report type is required (UPI_ID, LINK, or MESSAGE)")
    private String reportType;

    @NotBlank(message = "Target value (scam UPI ID, URL, or text) is required")
    private String targetValue;

    @NotBlank(message = "Description of scam attempt is required")
    private String description;

    private String reporterContact;

    public ScamReportRequest() {}

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(String targetValue) {
        this.targetValue = targetValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReporterContact() {
        return reporterContact;
    }

    public void setReporterContact(String reporterContact) {
        this.reporterContact = reporterContact;
    }
}
