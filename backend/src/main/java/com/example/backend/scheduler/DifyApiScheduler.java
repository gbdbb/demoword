package com.example.backend.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class DifyApiScheduler {

    private final RestTemplate restTemplate;
    private static final String API_URL = "https://api.dify.ai/v1/chat-messages";
    private static final String API_KEY = "app-w993jehlsWAxaVBesBYeIliX";

    public DifyApiScheduler() {
        this.restTemplate = new RestTemplate();
    }

    @Scheduled(cron = "0 0 8 * * ?")
    public void callDifyApi() {
        log.info("开始执行每日定时调用Dify API...");
        
        try {
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(API_KEY);

            // 设置请求体
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", new HashMap<>());
            requestBody.put("query", "开始");
            requestBody.put("response_mode", "streaming");
            requestBody.put("conversation_id", "");
            requestBody.put("user", "abc-123");

            // 创建HTTP请求实体
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            String response = restTemplate.exchange(
                    API_URL,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            ).getBody();

            log.info("Dify API调用成功，响应: {}", response);
        } catch (Exception e) {
            log.error("调用Dify API时发生错误: {}", e.getMessage(), e);
        }
    }
}