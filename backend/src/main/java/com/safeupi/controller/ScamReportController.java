package com.safeupi.controller;

import com.safeupi.config.JwtService;
import com.safeupi.dto.ScamReportRequest;
import com.safeupi.model.ScamReport;
import com.safeupi.service.ScamReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ScamReportController {

    private final ScamReportService scamReportService;
    private final JwtService jwtService;

    public ScamReportController(ScamReportService scamReportService, JwtService jwtService) {
        this.scamReportService = scamReportService;
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

    @PostMapping
    public ResponseEntity<?> submitReport(@Valid @RequestBody ScamReportRequest request,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Long userId = extractUserId(authHeader);
            ScamReport report = scamReportService.submitReport(request, userId);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to submit report: " + e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyReports(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required."));
        }
        List<ScamReport> reports = scamReportService.getUserReports(userId);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ScamReport>> getRecentCommunityReports() {
        List<ScamReport> reports = scamReportService.getRecentCommunityReports();
        return ResponseEntity.ok(reports);
    }
}
