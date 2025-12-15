package com.example.backend.service;

import com.example.backend.dto.HoldingDto;
import com.example.backend.dto.NewsDto;
import com.example.backend.dto.ProposedChangeDto;
import com.example.backend.dto.ReportDetailDto;
import com.example.backend.dto.ReportSummaryDto;
import com.example.backend.model.Report;
import com.example.backend.model.ReportChange;
import com.example.backend.model.ReportNews;
import com.example.backend.model.ReportStatus;
import com.example.backend.repository.PortfolioHoldingRepository;
import com.example.backend.repository.ReportRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ReportRepository reportRepository;
    private final PortfolioHoldingRepository holdingRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public List<ReportSummaryDto> listReports() {
        return reportRepository.findAll(Sort.by(Sort.Direction.DESC, "generatedAt"))
                .stream()
                .map(report -> ReportSummaryDto.builder()
                        .id(report.getId())
                        .date(report.getGeneratedAt() != null ? report.getGeneratedAt().format(FORMATTER) : null)
                        .status(report.getStatus() != null ? report.getStatus().name().toLowerCase(Locale.ROOT) : null)
                        .riskLevel(report.getRiskLevel() != null ? report.getRiskLevel().name().toLowerCase(Locale.ROOT) : null)
                        .build())
                .toList();
    }

    @Transactional
    public void approve(String id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "报告不存在: " + id));
        report.setStatus(ReportStatus.APPROVED);
        reportRepository.save(report);
    }

    @Transactional
    public void reject(String id, String reason) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "报告不存在: " + id));
        report.setStatus(ReportStatus.REJECTED);
        report.setReviewRemark(reason);
        reportRepository.save(report);
    }

    @Transactional
    public ReportDetailDto getReportDetail(String id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "报告不存在: " + id));

        List<NewsDto> relatedNews = report.getReportNews() == null ? List.of() :
                report.getReportNews().stream()
                        .map(ReportNews::getNews)
                        .map(news -> NewsDto.builder()
                                .id(news.getId())
                                .coin(news.getCoin())
                                .sentiment(news.getSentiment() != null ? news.getSentiment().name().toLowerCase(Locale.ROOT) : null)
                                .summary(news.getSummary())
                                .source(news.getSourceUrl())
                                .title(news.getTitle())
                                .time(news.getPublishedAt() != null ? news.getPublishedAt().format(FORMATTER) : null)
                                .build())
                        .toList();

        List<ProposedChangeDto> changes = report.getChanges() == null ? List.of() :
                report.getChanges().stream()
                        .map(this::toChangeDto)
                        .toList();

        List<HoldingDto> currentHoldings = holdingRepository.findAll().stream()
                .map(h -> HoldingDto.builder()
                        .coin(h.getCoin())
                        .amount(h.getAmount())
                        .percentage(h.getPercentage())
                        .value(h.getValueUsd())
                        .build())
                .toList();

        return ReportDetailDto.builder()
                .id(report.getId())
                .date(report.getGeneratedAt() != null ? report.getGeneratedAt().format(FORMATTER) : null)
                .status(report.getStatus() != null ? report.getStatus().name().toLowerCase(Locale.ROOT) : null)
                .riskLevel(report.getRiskLevel() != null ? report.getRiskLevel().name().toLowerCase(Locale.ROOT) : null)
                .aiJudgment(report.getAiJudgment())
                .relatedNews(relatedNews)
                .proposedChanges(changes)
                .currentHoldings(currentHoldings)
                .build();
    }

    private ProposedChangeDto toChangeDto(ReportChange change) {
        return ProposedChangeDto.builder()
                .coin(change.getCoin())
                .currentAmount(change.getCurrentAmount())
                .proposedAmount(change.getProposedAmount())
                .change(change.getChangePct())
                .reason(change.getReason())
                .build();
    }
}
