package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "report_change")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private Report report;

    private String coin;

    @Column(name = "current_amount")
    private BigDecimal currentAmount;

    @Column(name = "proposed_amount")
    private BigDecimal proposedAmount;

    @Column(name = "change_pct")
    private BigDecimal changePct;

    @Column(columnDefinition = "TEXT")
    private String reason;
}
