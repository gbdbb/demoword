package com.example.backend.controller;

import com.example.backend.dto.MetricsDto;
import com.example.backend.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metrics")
@CrossOrigin
@RequiredArgsConstructor
public class MetricsController {
    private final MetricsService metricsService;

    @GetMapping
    public MetricsDto load() {
        return metricsService.loadMetrics();
    }
}
