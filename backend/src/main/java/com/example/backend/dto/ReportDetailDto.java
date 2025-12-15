package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDetailDto {
    private String id;
    private String date;
    private String status;
    private String riskLevel;
    private String aiJudgment;
    private List<NewsDto> relatedNews;
    private List<ProposedChangeDto> proposedChanges;
    private List<HoldingDto> currentHoldings;
}
