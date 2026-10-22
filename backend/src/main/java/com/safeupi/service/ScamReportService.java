package com.safeupi.service;

import com.safeupi.dto.ScamReportRequest;
import com.safeupi.model.ScamIndicator;
import com.safeupi.model.ScamReport;
import com.safeupi.model.User;
import com.safeupi.repository.ScamIndicatorRepository;
import com.safeupi.repository.ScamReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ScamReportService {

    private final ScamReportRepository scamReportRepository;
    private final ScamIndicatorRepository scamIndicatorRepository;
    private final UserService userService;

    public ScamReportService(ScamReportRepository scamReportRepository,
                             ScamIndicatorRepository scamIndicatorRepository,
                             UserService userService) {
        this.scamReportRepository = scamReportRepository;
        this.scamIndicatorRepository = scamIndicatorRepository;
        this.userService = userService;
    }

    @Transactional
    public ScamReport submitReport(ScamReportRequest req, Long userId) {
        ScamReport report = new ScamReport();
        if (userId != null) {
            User user = userService.getUserEntity(userId);
            report.setUser(user);
        }
        report.setReportType(req.getReportType().trim().toUpperCase());
        report.setTargetValue(req.getTargetValue().trim());
        report.setDescription(req.getDescription().trim());
        report.setReporterContact(req.getReporterContact());
        report.setStatus("CONFIRMED_COMMUNITY_REPORT");

        ScamReport saved = scamReportRepository.save(report);

        // Also add to active scam indicators so the rules engine immediately detects it!
        String indType = "UPI_ID".equalsIgnoreCase(req.getReportType()) ? "VPA"
                : "LINK".equalsIgnoreCase(req.getReportType()) ? "DOMAIN" : "KEYWORD";

        ScamIndicator indicator = new ScamIndicator(
                indType,
                req.getTargetValue().trim(),
                "COMMUNITY_FLAGGED",
                50,
                "Reported by user: " + req.getDescription().trim()
        );
        scamIndicatorRepository.save(indicator);

        return saved;
    }

    public List<ScamReport> getUserReports(Long userId) {
        return scamReportRepository.findByUserIdOrderByReportedAtDesc(userId);
    }

    public List<ScamReport> getRecentCommunityReports() {
        return scamReportRepository.findTop20ByOrderByReportedAtDesc();
    }
}
