package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NewsIngestRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String summary;

    @NotBlank
    private String coin;

    @NotBlank
    private String sentiment;

    private String sourceUrl;

    /**
     * Optional publish time, expects format yyyy-MM-dd HH:mm
     */
    private String publishedAt;
}
