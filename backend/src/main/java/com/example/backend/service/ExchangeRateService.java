package com.example.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.HttpURLConnection;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ExchangeRateService {
    private final RestTemplate restTemplate;
    private final String COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd,cny&include_24hr_change=true";

    public ExchangeRateService() {
        // 配置RestTemplate，增加超时时间和本地代理
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10秒连接超时
        factory.setReadTimeout(10000); // 10秒读取超时
        
        // 添加本地代理配置 (127.0.0.1:7897)
        java.net.Proxy proxy = new java.net.Proxy(java.net.Proxy.Type.HTTP, 
            new java.net.InetSocketAddress("127.0.0.1", 7897));
        factory.setProxy(proxy);
        
        this.restTemplate = new RestTemplate(factory);
    }

    public Map<String, Map<String, Double>> getExchangeRates() {
        try {
            log.info("Fetching exchange rates from CoinGecko API: {}", COINGECKO_API_URL);
            Map<String, Map<String, Double>> response = restTemplate.getForObject(COINGECKO_API_URL, Map.class);
            if (response == null) {
                log.error("Empty response from CoinGecko API");
                return createDefaultExchangeRates();
            }
            log.info("Successfully fetched exchange rates: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Failed to fetch exchange rates from CoinGecko API", e);
            // 返回默认汇率作为备用
            return createDefaultExchangeRates();
        }
    }

    // 创建默认汇率作为备用
    private Map<String, Map<String, Double>> createDefaultExchangeRates() {
        Map<String, Map<String, Double>> defaultRates = new HashMap<>();
        
        // 添加默认的比特币汇率
        Map<String, Double> bitcoinRates = new HashMap<>();
        bitcoinRates.put("usd", 45000.0);
        bitcoinRates.put("cny", 320000.0);
        bitcoinRates.put("usd_24h_change", 2.5);
        bitcoinRates.put("cny_24h_change", 2.5);
        defaultRates.put("bitcoin", bitcoinRates);
        
        // 添加默认的以太坊汇率
        Map<String, Double> ethereumRates = new HashMap<>();
        ethereumRates.put("usd", 2300.0);
        ethereumRates.put("cny", 16500.0);
        ethereumRates.put("usd_24h_change", -1.2);
        ethereumRates.put("cny_24h_change", -1.2);
        defaultRates.put("ethereum", ethereumRates);
        
        // 添加默认的Solana汇率
        Map<String, Double> solanaRates = new HashMap<>();
        solanaRates.put("usd", 100.0);
        solanaRates.put("cny", 720.0);
        solanaRates.put("usd_24h_change", 5.8);
        solanaRates.put("cny_24h_change", 5.8);
        defaultRates.put("solana", solanaRates);
        
        // 添加默认的Tether汇率
        Map<String, Double> tetherRates = new HashMap<>();
        tetherRates.put("usd", 1.0);
        tetherRates.put("cny", 7.2);
        tetherRates.put("usd_24h_change", 0.0);
        tetherRates.put("cny_24h_change", 0.0);
        defaultRates.put("tether", tetherRates);
        
        log.info("Using default exchange rates: {}", defaultRates);
        return defaultRates;
    }
}
