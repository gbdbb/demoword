package com.example.backend.repository;

import com.example.backend.model.ReportChange;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportChangeRepository extends JpaRepository<ReportChange, Long> {
}
