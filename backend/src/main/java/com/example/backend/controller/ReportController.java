package com.example.backend.controller;

import com.example.backend.dto.ReportDetailDto;
import com.example.backend.dto.ReportSummaryDto;
import com.example.backend.dto.ReviewRequest;
import com.example.backend.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping
    public List<ReportSummaryDto> listReports() {
        return reportService.listReports();
    }

    @GetMapping("/{id}")
    public ReportDetailDto detail(@PathVariable String id) {
        return reportService.getReportDetail(id);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, String>> approve(@PathVariable String id) {
        reportService.approve(id);
        return ResponseEntity.ok(Map.of("status", "approved"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> reject(@PathVariable String id, @Valid @RequestBody ReviewRequest request) {
        reportService.reject(id, request.getReason());
        return ResponseEntity.ok(Map.of("status", "rejected"));
    }
}
