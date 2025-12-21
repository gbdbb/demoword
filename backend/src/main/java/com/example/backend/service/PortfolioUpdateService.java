package com.example.backend.service;

import com.example.backend.model.PortfolioHolding;
import com.example.backend.model.PortfolioHistory;
import com.example.backend.repository.PortfolioHoldingRepository;
import com.example.backend.repository.PortfolioHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PortfolioUpdateService {

    private final ExchangeRateService exchangeRateService;
    private final PortfolioHoldingRepository portfolioHoldingRepository;
    private final PortfolioHistoryRepository portfolioHistoryRepository;

    // CoinGecko ID与币种的映射
    private static final Map<String, String> COIN_GECKO_ID_MAP = Map.of(
            "BTC", "bitcoin",
            "ETH", "ethereum",
            "SOL", "solana",
            "USDT", "tether"
    );

    // 更新所有持仓的实时市值和占比
    public void updatePortfolioValues() {
        try {
            // 获取最新汇率数据
            Map<String, Map<String, Object>> exchangeRates = (Map<String, Map<String, Object>>) (Map<?, ?>) exchangeRateService.getExchangeRates();
            if (exchangeRates == null || exchangeRates.isEmpty()) {
                log.error("No exchange rates available");
                return;
            }

            // 获取所有持仓数据
            List<PortfolioHolding> holdings = portfolioHoldingRepository.findAll();
            if (holdings.isEmpty()) {
                log.error("No portfolio holdings found");
                return;
            }

            // 计算总实时市值
            BigDecimal totalRealTimeValue = BigDecimal.ZERO;
            for (PortfolioHolding holding : holdings) {
                BigDecimal realTimeValue = calculateRealTimeValue(holding, exchangeRates);
                totalRealTimeValue = totalRealTimeValue.add(realTimeValue);
            }

            // 更新每个持仓的实时市值和占比
            for (PortfolioHolding holding : holdings) {
                BigDecimal realTimeValue = calculateRealTimeValue(holding, exchangeRates);
                BigDecimal realTimePercentage = calculateRealTimePercentage(realTimeValue, totalRealTimeValue);

                // 更新持仓数据
                holding.setValueUsd(realTimeValue.setScale(2, RoundingMode.HALF_UP));
                holding.setPercentage(realTimePercentage.setScale(2, RoundingMode.HALF_UP));
                holding.setUpdatedAt(LocalDateTime.now());
            }

            // 保存更新后的数据到数据库
            portfolioHoldingRepository.saveAll(holdings);
            log.info("Successfully updated portfolio real-time values");
            
            // 写入历史记录到portfolio_history表
            LocalDate today = LocalDate.now();
            List<PortfolioHistory> existingHistory = portfolioHistoryRepository.findBySnapDate(today);
            
            List<PortfolioHistory> historyRecords;
            if (!existingHistory.isEmpty()) {
                // 如果当天已有记录，则更新现有记录的percentage
                Map<String, PortfolioHistory> existingMap = existingHistory.stream()
                        .collect(Collectors.toMap(PortfolioHistory::getCoin, history -> history));
                
                historyRecords = holdings.stream()
                        .map(holding -> {
                            PortfolioHistory history = existingMap.get(holding.getCoin());
                            if (history != null) {
                                // 更新现有记录的percentage
                                history.setPercentage(holding.getPercentage());
                                return history;
                            } else {
                                // 为没有现有记录的币种创建新记录
                                return PortfolioHistory.builder()
                                        .snapDate(today)
                                        .coin(holding.getCoin())
                                        .percentage(holding.getPercentage())
                                        .build();
                            }
                        })
                        .collect(Collectors.toList());
                
                log.info("Updating existing portfolio history records for date: {}", today);
            } else {
                // 如果当天没有记录，则创建新记录
                historyRecords = holdings.stream()
                        .map(holding -> PortfolioHistory.builder()
                                .snapDate(today)
                                .coin(holding.getCoin())
                                .percentage(holding.getPercentage())
                                .build())
                        .collect(Collectors.toList());
                
                log.info("Creating new portfolio history records for date: {}", today);
            }
            
            portfolioHistoryRepository.saveAll(historyRecords);
            log.info("Successfully saved portfolio history records");

        } catch (Exception e) {
            log.error("Failed to update portfolio values", e);
        }
    }

    // 计算单个持仓的实时市值
    private BigDecimal calculateRealTimeValue(PortfolioHolding holding, Map<String, Map<String, Object>> exchangeRates) {
        String coinId = COIN_GECKO_ID_MAP.get(holding.getCoin());
        if (coinId == null || !exchangeRates.containsKey(coinId)) {
            log.warn("No exchange rate available for coin: {}", holding.getCoin());
            return holding.getValueUsd(); // 返回现有值作为备选
        }

        Map<String, Object> coinRates = exchangeRates.get(coinId);
        if (!coinRates.containsKey("usd")) {
            log.warn("No USD exchange rate available for coin: {}", holding.getCoin());
            return holding.getValueUsd(); // 返回现有值作为备选
        }

        // 获取USD汇率，处理可能的Integer或Double类型
        Object rateObj = coinRates.get("usd");
        double usdRate;
        if (rateObj instanceof Integer) {
            usdRate = ((Integer) rateObj).doubleValue();
        } else if (rateObj instanceof Double) {
            usdRate = (Double) rateObj;
        } else {
            log.warn("Unexpected rate type for coin {}: {}", holding.getCoin(), rateObj.getClass().getName());
            return holding.getValueUsd(); // 返回现有值作为备选
        }

        // 计算实时市值：数量 * USD汇率
        BigDecimal amount = holding.getAmount();
        return amount.multiply(BigDecimal.valueOf(usdRate));
    }

    // 计算单个持仓的实时占比
    private BigDecimal calculateRealTimePercentage(BigDecimal realTimeValue, BigDecimal totalRealTimeValue) {
        if (totalRealTimeValue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        // 计算占比：(实时市值 / 总实时市值) * 100
        return realTimeValue.divide(totalRealTimeValue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }
}