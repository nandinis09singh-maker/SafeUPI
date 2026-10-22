package com.safeupi.service;

import com.safeupi.dto.DashboardStatsDto;
import com.safeupi.model.RiskLevel;
import com.safeupi.model.ScanHistory;
import com.safeupi.model.ScanType;
import com.safeupi.repository.ScanHistoryRepository;
import com.safeupi.repository.ScamReportRepository;
import com.safeupi.repository.TrustedContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HistoryService {

    private final ScanHistoryRepository scanHistoryRepository;
    private final ScamReportRepository scamReportRepository;
    private final TrustedContactRepository trustedContactRepository;

    public HistoryService(ScanHistoryRepository scanHistoryRepository,
                          ScamReportRepository scamReportRepository,
                          TrustedContactRepository trustedContactRepository) {
        this.scanHistoryRepository = scanHistoryRepository;
        this.scamReportRepository = scamReportRepository;
        this.trustedContactRepository = trustedContactRepository;
    }

    public List<ScanHistory> getUserHistory(Long userId) {
        if (userId != null) {
            return scanHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return scanHistoryRepository.findRecentGlobalScans();
    }

    public DashboardStatsDto getDashboardStats(Long userId) {
        long totalScans;
        long high;
        long med;
        long low;
        long reports;
        long contacts;
        Map<String, Long> byType = new HashMap<>();

        if (userId != null) {
            totalScans = scanHistoryRepository.countByUserId(userId);
            high = scanHistoryRepository.countByUserIdAndRiskLevel(userId, RiskLevel.HIGH);
            med = scanHistoryRepository.countByUserIdAndRiskLevel(userId, RiskLevel.MEDIUM);
            low = scanHistoryRepository.countByUserIdAndRiskLevel(userId, RiskLevel.LOW);
            reports = scamReportRepository.countByUserId(userId);
            contacts = trustedContactRepository.countByUserId(userId);

            byType.put("QR", scanHistoryRepository.countByUserIdAndScanType(userId, ScanType.QR));
            byType.put("MESSAGE", scanHistoryRepository.countByUserIdAndScanType(userId, ScanType.MESSAGE));
            byType.put("LINK", scanHistoryRepository.countByUserIdAndScanType(userId, ScanType.LINK));
        } else {
            totalScans = scanHistoryRepository.count();
            high = 0;
            med = 0;
            low = 0;
            reports = scamReportRepository.count();
            contacts = 0;
            byType.put("QR", 0L);
            byType.put("MESSAGE", 0L);
            byType.put("LINK", 0L);
        }

        return new DashboardStatsDto(totalScans, high, med, low, reports, contacts, byType);
    }

    @Transactional
    public void clearUserHistory(Long userId) {
        if (userId != null) {
            scanHistoryRepository.deleteByUserId(userId);
        }
    }

    @Transactional
    public void deleteHistoryItem(Long id, Long userId) {
        scanHistoryRepository.findById(id).ifPresent(item -> {
            if (userId == null || (item.getUser() != null && item.getUser().getId().equals(userId))) {
                scanHistoryRepository.delete(item);
            }
        });
    }
}
