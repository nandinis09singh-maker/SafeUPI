package com.safeupi.controller;

import com.safeupi.config.JwtService;
import com.safeupi.dto.DashboardStatsDto;
import com.safeupi.model.ScanHistory;
import com.safeupi.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;
    private final JwtService jwtService;

    public HistoryController(HistoryService historyService, JwtService jwtService) {
        this.historyService = historyService;
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

    @GetMapping
    public ResponseEntity<List<ScanHistory>> getHistory(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        List<ScanHistory> history = historyService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        DashboardStatsDto stats = historyService.getDashboardStats(userId);
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistoryItem(@PathVariable Long id,
                                               @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        historyService.deleteHistoryItem(id, userId);
        return ResponseEntity.ok(Map.of("message", "History item removed"));
    }

    @PostMapping("/clear")
    public ResponseEntity<?> clearHistory(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId != null) {
            historyService.clearUserHistory(userId);
        }
        return ResponseEntity.ok(Map.of("message", "History cleared"));
    }
}
