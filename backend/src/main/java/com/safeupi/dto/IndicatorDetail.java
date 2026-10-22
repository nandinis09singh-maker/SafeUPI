package com.safeupi.dto;

public class IndicatorDetail {
    private String id;
    private String title;
    private String description;
    private String severity; // HIGH, MEDIUM, LOW, INFO
    private int weight;

    public IndicatorDetail() {}

    public IndicatorDetail(String id, String title, String description, String severity, int weight) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.weight = weight;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }
}
