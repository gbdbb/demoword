package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProposedChangeDto {
    private String coin;
    private BigDecimal currentAmount;
    private BigDecimal proposedAmount;
    private BigDecimal change;
    private String reason;
}
