package com.safeupi.controller;

import com.safeupi.config.JwtService;
import com.safeupi.dto.AnalysisResponse;
import com.safeupi.dto.LinkAnalysisRequest;
import com.safeupi.dto.MessageAnalysisRequest;
import com.safeupi.dto.QrAnalysisRequest;
import com.safeupi.service.AnalysisService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analyze")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final JwtService jwtService;

    public AnalysisController(AnalysisService analysisService, JwtService jwtService) {
        this.analysisService = analysisService;
        this.jwtService = jwtService;
    }

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                return jwtService.extractUserId(authHeader.substring(7));
            } catch (Exception ignored) {}
        }
        return null;
    }

    @PostMapping("/qr")
    public ResponseEntity<?> analyzeQr(@Valid @RequestBody QrAnalysisRequest request,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            AnalysisResponse response = analysisService.analyzeAndSaveQr(request.getPayload(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "QR analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/message")
    public ResponseEntity<?> analyzeMessage(@Valid @RequestBody MessageAnalysisRequest request,
                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            AnalysisResponse response = analysisService.analyzeAndSaveMessage(request.getMessage(), request.getSenderId(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message analysis failed: " + e.getMessage()));
        }
    }

    @PostMapping("/link")
    public ResponseEntity<?> analyzeLink(@Valid @RequestBody LinkAnalysisRequest request,
                                         @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            AnalysisResponse response = analysisService.analyzeAndSaveLink(request.getUrl(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Link analysis failed: " + e.getMessage()));
        }
    }
}
