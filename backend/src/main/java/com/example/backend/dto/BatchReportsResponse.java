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
public class BatchReportsResponse {
    
    private List<BatchInsertResponse.ResponseData> results;
    
    public static BatchReportsResponse of(List<BatchInsertResponse.ResponseData> results) {
        return BatchReportsResponse.builder()
                .results(results)
                .build();
    }
}