package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsDto {
    private Long id;
    private String time;
    private String coin;
    private String sentiment;
    private String summary;
    private String source;
    private String title;
    private Boolean read;
}
