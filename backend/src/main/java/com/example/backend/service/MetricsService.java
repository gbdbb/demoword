package com.example.backend.service;

import com.example.backend.dto.MetricsDto;
import com.example.backend.model.ReportStatus;
import com.example.backend.repository.NewsRepository;
import com.example.backend.repository.PortfolioHoldingRepository;
import com.example.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class MetricsService {
    private final NewsRepository newsRepository;
    private final ReportRepository reportRepository;
    private final PortfolioHoldingRepository portfolioHoldingRepository;

    public MetricsDto loadMetrics() {
        long unread = newsRepository.countByReadFalse();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        BigDecimal totalAssetValue = portfolioHoldingRepository.findAll().stream()
                .map(h -> h.getValueUsd() == null ? BigDecimal.ZERO : h.getValueUsd())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return MetricsDto.builder()
                .unreadNews(unread)
                .pendingReports(pendingReports)
                .totalAssetValue(totalAssetValue)
                .build();
    }
}
