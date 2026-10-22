package com.safeupi.repository;

import com.safeupi.model.TrustedContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrustedContactRepository extends JpaRepository<TrustedContact, Long> {
    List<TrustedContact> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
