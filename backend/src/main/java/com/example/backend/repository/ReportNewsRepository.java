package com.example.backend.repository;

import com.example.backend.model.ReportNews;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportNewsRepository extends JpaRepository<ReportNews, Long> {
    List<ReportNews> findByReportId(String reportId);
}
