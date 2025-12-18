package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchInsertRequest {
    
    @Valid
    @NotNull(message = "报告数据不能为空")
    private ReportData report;
    
    @Valid
    @NotEmpty(message = "报告变更建议不能为空")
    @JsonProperty("report_changes")
    private List<ReportChangeData> reportChanges;
    
    @NotEmpty(message = "关联新闻列表不能为空")
    @JsonProperty("report_news")
    private List<Integer> reportNews;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportData {
        
        @NotBlank(message = "报告ID不能为空")
        @Pattern(regexp = "^R\\d+$", message = "报告ID格式不正确，应以R开头+数字")
        private String id;
        
        @NotBlank(message = "生成时间不能为空")
        @JsonProperty("generated_at")
        private String generatedAt;
        
        @NotBlank(message = "状态不能为空")
        @Pattern(regexp = "^(PENDING|APPROVED|REJECTED)$", message = "状态仅允许PENDING/APPROVED/REJECTED")
        private String status;
        
        @NotBlank(message = "AI判断不能为空")
        @JsonProperty("ai_judgment")
        private String aiJudgment;
        
        @NotBlank(message = "风险等级不能为空")
        @Pattern(regexp = "^(LOW|MEDIUM|HIGH)$", message = "风险等级仅允许LOW/MEDIUM/HIGH")
        @JsonProperty("risk_level")
        private String riskLevel;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportChangeData {
        
        @NotBlank(message = "币种不能为空")
        private String coin;
        
        @NotNull(message = "当前数量不能为空")
        @DecimalMin(value = "0.01", message = "当前数量必须大于0")
        @JsonProperty("current_amount")
        private BigDecimal currentAmount;
        
        @NotNull(message = "建议数量不能为空")
        @DecimalMin(value = "0.01", message = "建议数量必须大于0")
        @JsonProperty("proposed_amount")
        private BigDecimal proposedAmount;
        
        @NotBlank(message = "变更原因不能为空")
        private String reason;
    }
}