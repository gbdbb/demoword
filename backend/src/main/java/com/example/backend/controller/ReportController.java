package com.example.backend.controller;

import com.example.backend.dto.BatchInsertRequest;
import com.example.backend.dto.BatchInsertResponse;
import com.example.backend.dto.BatchReportsRequest;
import com.example.backend.dto.BatchReportsResponse;
import com.example.backend.dto.ReportDetailDto;
import com.example.backend.dto.ReportSummaryDto;
import com.example.backend.dto.ReviewRequest;
import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.ReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin
@RequiredArgsConstructor
@Slf4j
public class ReportController {
    private final ReportService reportService;
    private final UserRepository userRepository;

    @GetMapping
    public List<ReportSummaryDto> listReports() {
        return reportService.listReports();
    }

    @GetMapping("/{id}")
    public ReportDetailDto detail(@PathVariable Long id) {
        return reportService.getReportDetail(id);
    }

    // 辅助方法：检查用户是否为管理员
    private boolean isAdmin(@RequestHeader(value = "X-Username", required = false) String username) {
        if (username == null) {
            return false;
        }
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return false;
        }
        return user.getRoles().stream()
                .anyMatch(role -> role.getRoleCode().equals(Role.ADMIN));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, String>> approve(@PathVariable Long id, 
            @RequestHeader(value = "X-Username", required = false) String username) {
        if (!isAdmin(username)) {
            return ResponseEntity.status(403).body(Map.of("error", "权限不足，需要管理员权限"));
        }
        reportService.approve(id);
        return ResponseEntity.ok(Map.of("status", "approved"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> reject(@PathVariable Long id, 
            @Valid @RequestBody ReviewRequest request, 
            @RequestHeader(value = "X-Username", required = false) String username) {
        if (!isAdmin(username)) {
            return ResponseEntity.status(403).body(Map.of("error", "权限不足，需要管理员权限"));
        }
        reportService.reject(id, request.getReason());
        return ResponseEntity.ok(Map.of("status", "rejected"));
    }
    
    @PostMapping("/{id}/undo")
    public ResponseEntity<Map<String, String>> undo(@PathVariable Long id, 
            @RequestHeader(value = "X-Username", required = false) String username) {
        if (!isAdmin(username)) {
            return ResponseEntity.status(403).body(Map.of("error", "权限不足，需要管理员权限"));
        }
        reportService.undo(id);
        return ResponseEntity.ok(Map.of("status", "pending"));
    }

    /**
     * 测试端点
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("API测试成功");
    }

    /**
     * Echo端点 - 用于调试请求体
     */
    @PostMapping("/echo")
    public String echo(@RequestBody String body) {
        log.info("收到请求体: {}", body);
        return "Echo: " + body;
    }

    /**
     * 调试端点 - 用于检查JSON反序列化
     */
    @PostMapping("/debug")
    public ResponseEntity<String> debug(@RequestBody String body) {
        log.info("调试端点收到请求体: {}", body);
        return ResponseEntity.ok("收到请求: " + body);
    }

    /**
     * 插入单条报告数据API
     * 路径: /api/reports
     * 方法: POST
     * 功能: 插入单条报告数据
     */
    @PostMapping
    public ResponseEntity<BatchInsertResponse> insertReport(@Valid @RequestBody BatchInsertRequest request) {
        log.info("收到插入单条报告请求: {}", request);
        
        try {
            Long reportId = reportService.batchInsertReport(request);
            log.info("插入报告成功，报告ID: {}", reportId);
            BatchInsertResponse.ResponseData data = BatchInsertResponse.ResponseData.builder()
                    .reportId(reportId)
                    .build();
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(200)
                    .msg("数据插入成功")
                    .data(data)
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 数据校验失败，返回400
            log.error("插入报告数据校验失败: {}", e.getMessage());
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(400)
                    .msg(e.getMessage())
                    .data(null)
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            // 其他异常，返回500
            log.error("插入报告异常: {}", e.getMessage(), e);
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(500)
                    .msg("异常: " + e.getMessage())
                    .data(null)
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 批量插入多条报告数据API
     * 路径: /api/reports/batch
     * 方法: POST
     * 功能: 批量插入多条报告数据
     */
    @PostMapping("/batch")
    public ResponseEntity<BatchReportsResponse> insertReports(@Valid @RequestBody BatchReportsRequest request) {
        log.info("收到批量插入多条报告请求，报告数量: {}", request.getReports().size());
        
        try {
            // 创建结果列表
            java.util.List<BatchInsertResponse.ResponseData> results = new java.util.ArrayList<>();
            
            // 逐条插入报告
            for (BatchInsertRequest reportRequest : request.getReports()) {
                try {
                    Long reportId = reportService.batchInsertReport(reportRequest);
                    log.info("插入报告成功，报告ID: {}", reportId);
                    
                    BatchInsertResponse.ResponseData data = BatchInsertResponse.ResponseData.builder()
                            .reportId(reportId)
                            .build();
                    results.add(data);
                } catch (Exception e) {
                    log.error("插入单条报告失败: {}", e.getMessage(), e);
                    // 对于批量操作，可以选择继续处理其他报告或者整体失败
                    // 这里我们选择记录错误但继续处理其他报告
                    BatchInsertResponse.ResponseData data = BatchInsertResponse.ResponseData.builder()
                            .reportId(null)
                            .build();
                    results.add(data);
                }
            }
            
            BatchReportsResponse response = BatchReportsResponse.of(results);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 数据校验失败，返回400
            log.error("批量插入报告数据校验失败: {}", e.getMessage());
            BatchReportsResponse response = BatchReportsResponse.builder()
                    .results(java.util.Collections.emptyList())
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            // 其他异常，返回500
            log.error("批量插入报告异常: {}", e.getMessage(), e);
            BatchReportsResponse response = BatchReportsResponse.builder()
                    .results(java.util.Collections.emptyList())
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 批量插入报告数据API (保留原有接口以兼容旧客户端)
     * 路径: /api/reports/batch-insert
     * 方法: POST
     * 功能: 将报告主记录、报告变更建议、报告新闻关联数据批量写入MySQL数据库
     */
    @PostMapping("/batch-insert")
    public ResponseEntity<BatchInsertResponse> batchInsertReport(@RequestBody String requestBody) {
        log.info("收到批量插入报告请求体: {}", requestBody);
        
        try {
            // 尝试手动解析JSON
            ObjectMapper mapper = new ObjectMapper();
            BatchInsertRequest request = mapper.readValue(requestBody, BatchInsertRequest.class);
            log.info("解析后的请求: {}", request);
            
            // 先检查请求是否有效
            if (request == null) {
                return ResponseEntity.badRequest().body(BatchInsertResponse.builder()
                        .code(400)
                        .msg("请求体不能为空")
                        .data(null)
                        .build());
            }
            
            if (request.getReport() == null) {
                return ResponseEntity.badRequest().body(BatchInsertResponse.builder()
                        .code(400)
                        .msg("报告数据不能为空")
                        .data(null)
                        .build());
            }
            
            log.info("状态: {}", request.getReport().getStatus());
            log.info("风险等级: {}", request.getReport().getRiskLevel());
            
            Long reportId = reportService.batchInsertReport(request);
            log.info("批量插入报告成功，报告ID: {}", reportId);
            BatchInsertResponse.ResponseData data = BatchInsertResponse.ResponseData.builder()
                    .reportId(reportId)
                    .build();
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(200)
                    .msg("数据插入成功")
                    .data(data)
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            // 数据校验失败，返回400
            log.error("批量插入报告数据校验失败: {}", e.getMessage());
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(400)
                    .msg(e.getMessage())
                    .data(null)
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            // 其他异常，返回500
            log.error("批量插入报告异常: {}", e.getMessage(), e);
            BatchInsertResponse response = BatchInsertResponse.builder()
                    .code(500)
                    .msg("异常: " + e.getMessage())
                    .data(null)
                    .build();
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 处理验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BatchInsertResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        log.error("请求参数验证失败: {}", ex.getMessage());
        StringBuilder errors = new StringBuilder();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            errors.append(error.getDefaultMessage()).append("; ");
        });
        
        BatchInsertResponse response = BatchInsertResponse.builder()
                .code(400)
                .msg("参数验证失败: " + errors.toString())
                .data(null)
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理JSON解析异常
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<BatchInsertResponse> handleJsonExceptions(HttpMessageNotReadableException ex) {
        log.error("JSON解析失败: {}", ex.getMessage());
        BatchInsertResponse response = BatchInsertResponse.builder()
                .code(400)
                .msg("JSON格式错误: " + ex.getMessage())
                .data(null)
                .build();
        return ResponseEntity.badRequest().body(response);
    }
}
