package com.example.backend.service;

import com.example.backend.dto.HoldingDto;
import com.example.backend.dto.PortfolioResponse;
import com.example.backend.model.PortfolioHistory;
import com.example.backend.model.PortfolioHolding;
import com.example.backend.repository.PortfolioHistoryRepository;
import com.example.backend.repository.PortfolioHoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {
    private final PortfolioHoldingRepository holdingRepository;
    private final PortfolioHistoryRepository historyRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM-dd");

    public PortfolioResponse getPortfolio() {
        List<HoldingDto> holdings = holdingRepository.findAll(Sort.by("coin")).stream()
                .map(this::toDto)
                .toList();

        List<PortfolioHistory> history = historyRepository.findAll(Sort.by("snapDate").ascending());
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        history.forEach(item -> {
            String key = item.getSnapDate().format(DATE_FORMATTER);
            Map<String, Object> record = grouped.computeIfAbsent(key, k -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("date", k);
                return map;
            });
            record.put(item.getCoin(), item.getPercentage());
        });

        List<Map<String, Object>> historyList = grouped.values().stream().collect(Collectors.toList());

        return PortfolioResponse.builder()
                .holdings(holdings)
                .history(historyList)
                .build();
    }

    private HoldingDto toDto(PortfolioHolding holding) {
        return HoldingDto.builder()
                .coin(holding.getCoin())
                .amount(holding.getAmount())
                .percentage(holding.getPercentage())
                .value(holding.getValueUsd())
                .build();
    }
}
