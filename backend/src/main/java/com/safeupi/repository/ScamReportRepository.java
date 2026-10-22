package com.safeupi.repository;

import com.safeupi.model.ScamReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScamReportRepository extends JpaRepository<ScamReport, Long> {
    List<ScamReport> findByUserIdOrderByReportedAtDesc(Long userId);
    List<ScamReport> findTop20ByOrderByReportedAtDesc();
    long countByUserId(Long userId);

    @Query("SELECT COUNT(s) > 0 FROM ScamReport s WHERE LOWER(s.targetValue) = LOWER(:targetValue) AND s.status != 'REJECTED'")
    boolean isTargetReportedAsScam(String targetValue);
}
