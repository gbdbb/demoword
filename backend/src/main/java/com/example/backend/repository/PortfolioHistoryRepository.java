package com.example.backend.repository;

import com.example.backend.model.PortfolioHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PortfolioHistoryRepository extends JpaRepository<PortfolioHistory, Long> {
    List<PortfolioHistory> findBySnapDateBetween(LocalDate start, LocalDate end);
    List<PortfolioHistory> findBySnapDate(LocalDate snapDate);
}
