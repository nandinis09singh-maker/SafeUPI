package com.safeupi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scam_indicators")
public class ScamIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String indicatorType; // VPA, DOMAIN, KEYWORD, PHONE

    @Column(nullable = false, length = 255)
    private String patternValue;

    @Column(nullable = false, length = 50)
    private String category; // LOTTERY, REFUND_FRAUD, PHISHING, IMPERSONATION, UTILITY_BILL

    @Column(nullable = false)
    private int riskWeight; // e.g. 10 to 60

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ScamIndicator() {}

    public ScamIndicator(String indicatorType, String patternValue, String category, int riskWeight, String description) {
        this.indicatorType = indicatorType;
        this.patternValue = patternValue;
        this.category = category;
        this.riskWeight = riskWeight;
        this.description = description;
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIndicatorType() {
        return indicatorType;
    }

    public void setIndicatorType(String indicatorType) {
        this.indicatorType = indicatorType;
    }

    public String getPatternValue() {
        return patternValue;
    }

    public void setPatternValue(String patternValue) {
        this.patternValue = patternValue;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getRiskWeight() {
        return riskWeight;
    }

    public void setRiskWeight(int riskWeight) {
        this.riskWeight = riskWeight;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
