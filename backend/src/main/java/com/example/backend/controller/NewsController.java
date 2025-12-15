package com.example.backend.controller;

import com.example.backend.dto.PagedResponse;
import com.example.backend.dto.NewsDto;
import com.example.backend.dto.NewsIngestRequest;
import com.example.backend.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@CrossOrigin
@RequiredArgsConstructor
public class NewsController {
    private final NewsService newsService;

    @GetMapping
    public PagedResponse<NewsDto> listNews(
            @RequestParam(defaultValue = "all") String coin,
            @RequestParam(defaultValue = "all") String sentiment,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return newsService.queryNews(coin, sentiment, page, size);
    }

    @PostMapping("/ingest")
    public Map<String, Object> ingest(@Valid @RequestBody NewsIngestRequest request) {
        Long id = newsService.ingestNews(request);
        return Map.of("id", id, "status", "ok");
    }

    @PostMapping("/ingest/batch")
    public Map<String, Object> ingestBatch(@Valid @RequestBody List<NewsIngestRequest> requests) {
        List<Long> ids = newsService.ingestNewsBatch(requests);
        return Map.of("ids", ids, "count", ids.size(), "status", "ok");
    }

    @PostMapping("/{id}/read")
    public Map<String, String> markRead(@PathVariable Long id) {
        newsService.markAsRead(id);
        return Map.of("status", "ok");
    }
}
