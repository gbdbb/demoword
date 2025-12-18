package com.example.backend.service;

import com.example.backend.dto.NewsDto;
import com.example.backend.dto.NewsIngestRequest;
import com.example.backend.dto.PagedResponse;
import com.example.backend.model.News;
import com.example.backend.model.SentimentType;
import com.example.backend.repository.NewsRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewsService {
    private final NewsRepository newsRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Set<String> ALLOWED_COINS = Set.of("BTC", "ETH", "SOL", "USDT");

    public PagedResponse<NewsDto> queryNews(String coin, String sentiment, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        Specification<News> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(coin) && !"all".equalsIgnoreCase(coin)) {
                predicates.add(cb.equal(root.get("coin"), coin));
            }
            if (StringUtils.hasText(sentiment) && !"all".equalsIgnoreCase(sentiment)) {
                try {
                    SentimentType sentimentType = SentimentType.valueOf(sentiment.toUpperCase(Locale.ROOT));
                    predicates.add(cb.equal(root.get("sentiment"), sentimentType));
                } catch (IllegalArgumentException ignored) {
                    // ignore invalid sentiment filter
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<News> result = newsRepository.findAll(specification, pageable);
        List<NewsDto> content = result.getContent().stream()
                .map(this::toDto)
                .toList();

        return PagedResponse.<NewsDto>builder()
                .content(content)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(result.getNumber())
                .size(result.getSize())
                .build();
    }

    public Long ingestNews(NewsIngestRequest request) {
        String normalizedCoin = normalizeCoin(request.getCoin());
        SentimentType sentiment = parseSentiment(request.getSentiment());
        LocalDateTime publishedAt = parsePublishedAt(request.getPublishedAt());

        News news = newsRepository.findFirstByTitleAndPublishedAt(request.getTitle(), publishedAt)
                .orElseGet(() -> News.builder()
                        .title(request.getTitle())
                        .publishedAt(publishedAt)
                        .build());

        news.setSummary(request.getSummary());
        news.setCoin(normalizedCoin);
        news.setSentiment(sentiment);
        news.setSourceUrl(request.getSourceUrl());
        if (news.getRead() == null) {
            news.setRead(false);
        }

        News saved = newsRepository.save(news);
        return saved.getId();
    }

    public List<Long> ingestNewsBatch(List<NewsIngestRequest> requests) {
        List<News> newsToSave = new ArrayList<>();
        
        for (NewsIngestRequest request : requests) {
            String normalizedCoin = normalizeCoin(request.getCoin());
            SentimentType sentiment = parseSentiment(request.getSentiment());
            LocalDateTime publishedAt = parsePublishedAt(request.getPublishedAt());

            News news = newsRepository.findFirstByTitleAndPublishedAt(request.getTitle(), publishedAt)
                    .orElseGet(() -> News.builder()
                            .title(request.getTitle())
                            .publishedAt(publishedAt)
                            .build());

            news.setSummary(request.getSummary());
            news.setCoin(normalizedCoin);
            news.setSentiment(sentiment);
            news.setSourceUrl(request.getSourceUrl());
            if (news.getRead() == null) {
                news.setRead(false);
            }

            newsToSave.add(news);
        }

        List<News> savedNews = newsRepository.saveAll(newsToSave);
        return savedNews.stream()
                .map(News::getId)
                .toList();
    }

    private NewsDto toDto(News news) {
        return NewsDto.builder()
                .id(news.getId())
                .coin(news.getCoin())
                .sentiment(news.getSentiment() != null ? news.getSentiment().name().toLowerCase(Locale.ROOT) : null)
                .summary(news.getSummary())
                .source(news.getSourceUrl())
                .title(news.getTitle())
                .time(news.getPublishedAt() != null ? news.getPublishedAt().format(FORMATTER) : null)
                .read(Boolean.TRUE.equals(news.getRead()))
                .build();
    }

    public void markAsRead(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "消息不存在: " + id));
        news.setRead(true);
        newsRepository.save(news);
    }

    private String normalizeCoin(String coin) {
        if (!StringUtils.hasText(coin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "coin is required");
        }
        String upper = coin.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_COINS.contains(upper)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported coin: " + coin);
        }
        return upper;
    }

    private SentimentType parseSentiment(String sentiment) {
        if (!StringUtils.hasText(sentiment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sentiment is required");
        }
        try {
            return SentimentType.valueOf(sentiment.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid sentiment: " + sentiment);
        }
    }

    private LocalDateTime parsePublishedAt(String publishedAt) {
        if (!StringUtils.hasText(publishedAt)) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(publishedAt.trim(), FORMATTER);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid publishedAt, expected yyyy-MM-dd HH:mm");
        }
    }
}
