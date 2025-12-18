package com.example.backend.service;

import com.example.backend.dto.BatchInsertRequest;
import com.example.backend.dto.HoldingDto;
import com.example.backend.dto.NewsDto;
import com.example.backend.dto.ProposedChangeDto;
import com.example.backend.dto.ReportDetailDto;
import com.example.backend.dto.ReportSummaryDto;
import com.example.backend.model.News;
import com.example.backend.model.Report;
import com.example.backend.model.ReportChange;
import com.example.backend.model.ReportNews;
import com.example.backend.model.ReportStatus;
import com.example.backend.model.RiskLevel;
import com.example.backend.repository.NewsRepository;
import com.example.backend.repository.PortfolioHoldingRepository;
import com.example.backend.repository.ReportChangeRepository;
import com.example.backend.repository.ReportNewsRepository;
import com.example.backend.repository.ReportRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ReportRepository reportRepository;
    private final ReportChangeRepository reportChangeRepository;
    private final ReportNewsRepository reportNewsRepository;
    private final NewsRepository newsRepository;
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

    /**
     * 批量插入报告数据
     * 数据校验模块：验证所有输入字段的有效性
     * 事务处理模块：确保三个表的写入在同一个事务中
     * 数据库操作模块：执行具体的数据库插入操作
     */
    @Transactional
    public String batchInsertReport(BatchInsertRequest request) {
        // 数据校验模块
        // 1. 检查report_id是否已存在
        if (reportRepository.existsById(request.getReport().getId())) {
            throw new IllegalArgumentException("报告ID已存在: " + request.getReport().getId());
        }

        // 2. 验证news_id是否都有效
        for (Integer newsId : request.getReportNews()) {
            if (!newsRepository.existsById(newsId.longValue())) {
                throw new IllegalArgumentException("新闻ID不存在: " + newsId);
            }
        }

        // 3. 验证current_amount是否为0（避免除零错误）
        for (BatchInsertRequest.ReportChangeData changeData : request.getReportChanges()) {
            if (changeData.getCurrentAmount().compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("币种 " + changeData.getCoin() + " 的当前持仓量不能为0");
            }
        }

        // 数据库操作模块（在事务中执行）
        try {
            // 1. 插入report主记录
            Report report = new Report();
            report.setId(request.getReport().getId());
            
            // 将字符串日期转换为LocalDateTime
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            LocalDateTime generatedAt = LocalDateTime.parse(request.getReport().getGeneratedAt(), formatter);
            report.setGeneratedAt(generatedAt);
            
            report.setStatus(ReportStatus.valueOf(request.getReport().getStatus()));
            report.setAiJudgment(request.getReport().getAiJudgment());
            report.setRiskLevel(RiskLevel.valueOf(request.getReport().getRiskLevel()));
            report = reportRepository.save(report);

            // 2. 遍历report_changes，计算change_pct，插入report_change
            for (BatchInsertRequest.ReportChangeData changeData : request.getReportChanges()) {
                // 自动计算change_pct = (proposed_amount - current_amount)/current_amount * 100
                BigDecimal changePct = changeData.getProposedAmount()
                        .subtract(changeData.getCurrentAmount())
                        .divide(changeData.getCurrentAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(1, RoundingMode.HALF_UP);

                ReportChange reportChange = new ReportChange();
                reportChange.setReport(report);
                reportChange.setCoin(changeData.getCoin());
                reportChange.setCurrentAmount(changeData.getCurrentAmount());
                reportChange.setProposedAmount(changeData.getProposedAmount());
                reportChange.setChangePct(changePct);
                reportChange.setReason(changeData.getReason());
                reportChangeRepository.save(reportChange);
            }

            // 3. 遍历report_news，插入report_news
            for (Integer newsId : request.getReportNews()) {
                News news = newsRepository.findById(newsId.longValue())
                        .orElseThrow(() -> new IllegalArgumentException("新闻ID不存在: " + newsId));

                ReportNews reportNews = new ReportNews();
                reportNews.setReport(report);
                reportNews.setNews(news);
                reportNewsRepository.save(reportNews);
            }

            return report.getId();
        } catch (IllegalArgumentException e) {
            // 直接抛出IllegalArgumentException，让控制器返回400错误
            throw e;
        } catch (Exception e) {
            // 其他异常，包装为RuntimeException，让控制器返回500错误
            throw new RuntimeException("批量插入报告数据失败: " + e.getMessage(), e);
        }
    }
}
