package com.safeupi.repository;

import com.safeupi.model.ScamIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScamIndicatorRepository extends JpaRepository<ScamIndicator, Long> {
    List<ScamIndicator> findByActiveTrue();
    List<ScamIndicator> findByIndicatorTypeAndActiveTrue(String indicatorType);
}
