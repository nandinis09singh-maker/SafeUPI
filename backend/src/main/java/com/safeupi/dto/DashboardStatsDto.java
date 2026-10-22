package com.safeupi.dto;

import java.util.Map;

public class DashboardStatsDto {
    private long totalScans;
    private long highRiskScans;
    private long mediumRiskScans;
    private long lowRiskScans;
    private long totalScamReports;
    private long trustedContactsCount;
    private Map<String, Long> scansByType;

    public DashboardStatsDto() {}

    public DashboardStatsDto(long totalScans, long highRiskScans, long mediumRiskScans, long lowRiskScans,
                             long totalScamReports, long trustedContactsCount, Map<String, Long> scansByType) {
        this.totalScans = totalScans;
        this.highRiskScans = highRiskScans;
        this.mediumRiskScans = mediumRiskScans;
        this.lowRiskScans = lowRiskScans;
        this.totalScamReports = totalScamReports;
        this.trustedContactsCount = trustedContactsCount;
        this.scansByType = scansByType;
    }

    public long getTotalScans() {
        return totalScans;
    }

    public void setTotalScans(long totalScans) {
        this.totalScans = totalScans;
    }

    public long getHighRiskScans() {
        return highRiskScans;
    }

    public void setHighRiskScans(long highRiskScans) {
        this.highRiskScans = highRiskScans;
    }

    public long getMediumRiskScans() {
        return mediumRiskScans;
    }

    public void setMediumRiskScans(long mediumRiskScans) {
        this.mediumRiskScans = mediumRiskScans;
    }

    public long getLowRiskScans() {
        return lowRiskScans;
    }

    public void setLowRiskScans(long lowRiskScans) {
        this.lowRiskScans = lowRiskScans;
    }

    public long getTotalScamReports() {
        return totalScamReports;
    }

    public void setTotalScamReports(long totalScamReports) {
        this.totalScamReports = totalScamReports;
    }

    public long getTrustedContactsCount() {
        return trustedContactsCount;
    }

    public void setTrustedContactsCount(long trustedContactsCount) {
        this.trustedContactsCount = trustedContactsCount;
    }

    public Map<String, Long> getScansByType() {
        return scansByType;
    }

    public void setScansByType(Map<String, Long> scansByType) {
        this.scansByType = scansByType;
    }
}
