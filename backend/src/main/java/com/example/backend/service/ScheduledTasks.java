package com.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final PortfolioUpdateService portfolioUpdateService;

    // 手动触发更新的方法（可以通过API调用）
    public void triggerManualUpdate() {
        log.info("Running manual portfolio update task");
        portfolioUpdateService.updatePortfolioValues();
        log.info("Manual portfolio update task completed");
    }
}