package com.example.backend.repository;

import com.example.backend.model.Report;
import com.example.backend.model.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, String> {
    long countByStatus(ReportStatus status);
}
