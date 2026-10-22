package com.safeupi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.safeupi.dto.AnalysisResponse;
import com.safeupi.model.ScanHistory;
import com.safeupi.model.User;
import com.safeupi.repository.ScanHistoryRepository;
import com.safeupi.service.engine.RiskRulesEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalysisService {

    private final RiskRulesEngine rulesEngine;
    private final ScanHistoryRepository scanHistoryRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public AnalysisService(RiskRulesEngine rulesEngine,
                           ScanHistoryRepository scanHistoryRepository,
                           UserService userService,
                           ObjectMapper objectMapper) {
        this.rulesEngine = rulesEngine;
        this.scanHistoryRepository = scanHistoryRepository;
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AnalysisResponse analyzeAndSaveQr(String payload, Long userId) {
        AnalysisResponse response = rulesEngine.analyzeQr(payload);
        saveHistoryRecord(response, payload, userId);
        return response;
    }

    @Transactional
    public AnalysisResponse analyzeAndSaveMessage(String message, String senderId, Long userId) {
        AnalysisResponse response = rulesEngine.analyzeMessage(message, senderId);
        saveHistoryRecord(response, message, userId);
        return response;
    }

    @Transactional
    public AnalysisResponse analyzeAndSaveLink(String url, Long userId) {
        AnalysisResponse response = rulesEngine.analyzeLink(url);
        saveHistoryRecord(response, url, userId);
        return response;
    }

    private void saveHistoryRecord(AnalysisResponse response, String rawInput, Long userId) {
        ScanHistory history = new ScanHistory();
        if (userId != null) {
            User user = userService.getUserEntity(userId);
            history.setUser(user);
        }
        history.setScanType(response.getScanType());
        history.setRawInput(rawInput);
        history.setRiskLevel(response.getRiskLevel());
        history.setRiskScore(response.getRiskScore());
        history.setPayeeVpa(response.getPayeeVpa());
        history.setPayeeName(response.getPayeeName());
        history.setAmount(response.getAmount());
        history.setExplanation(response.getExplanation());

        try {
            history.setIndicatorsJson(objectMapper.writeValueAsString(response.getIndicators()));
            history.setRecommendationsJson(objectMapper.writeValueAsString(response.getRecommendations()));
        } catch (JsonProcessingException e) {
            history.setIndicatorsJson("[]");
            history.setRecommendationsJson("[]");
        }

        ScanHistory saved = scanHistoryRepository.save(history);
        response.setHistoryId(saved.getId());
    }
}
