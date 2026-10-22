package com.safeupi.repository;

import com.safeupi.model.RiskLevel;
import com.safeupi.model.ScanHistory;
import com.safeupi.model.ScanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {

    List<ScanHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ScanHistory> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndRiskLevel(Long userId, RiskLevel riskLevel);

    long countByUserIdAndScanType(Long userId, ScanType scanType);

    void deleteByUserId(Long userId);

    @Query("SELECT s FROM ScanHistory s ORDER BY s.createdAt DESC")
    List<ScanHistory> findRecentGlobalScans();
}
