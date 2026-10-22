package com.safeupi.controller;

import com.safeupi.model.ScamIndicator;
import com.safeupi.repository.ScamIndicatorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/indicators")
public class IndicatorController {

    private final ScamIndicatorRepository scamIndicatorRepository;

    public IndicatorController(ScamIndicatorRepository scamIndicatorRepository) {
        this.scamIndicatorRepository = scamIndicatorRepository;
    }

    @GetMapping
    public ResponseEntity<List<ScamIndicator>> getActiveIndicators() {
        return ResponseEntity.ok(scamIndicatorRepository.findByActiveTrue());
    }
}
