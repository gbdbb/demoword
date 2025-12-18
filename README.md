# Dify 接入与数据表说明（精简版）

## 一分钟上手
- 数据库：执行 `backend/src/main/resources/schema.sql` 创建表，再执行 `data.sql` 生成演示数据。
- 后端：`cd backend && mvn spring-boot:run`，默认端口 8080。
- 直接可用的 Dify 入库接口：`POST /api/news/ingest`（详见下方）。其他 API：`GET /api/news`、`POST /api/news/{id}/read`、`GET /api/metrics`、`GET /api/portfolio`、`GET /api/reports`、`GET /api/reports/{id}`、`POST /api/reports/{id}/approve|reject`。

## Dify 入库接口
- URL：`POST /api/news/ingest`
- Body 字段：
  - `title`(必填)，`summary`(必填)
  - `coin` ∈ BTC/ETH/SOL/USDT（大小写皆可）
  - `sentiment` ∈ BULLISH/BEARISH/NEUTRAL（大小写皆可）
  - `sourceUrl`(可选)，`publishedAt`(可选，格式 `yyyy-MM-dd HH:mm`，缺省为当前时间)
- 幂等：`title + publishedAt` 存在则更新，不存在则新增。
- 响应：`{"id": <newId>, "status": "ok"}`。
- 示例：
```
curl -X POST http://localhost:8080/api/news/ingest ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"测试\",\"summary\":\"情绪测试\",\"coin\":\"BTC\",\"sentiment\":\"NEUTRAL\",\"sourceUrl\":\"https://example.com\",\"publishedAt\":\"2024-12-15 12:00\"}"
```
新增支持批量添加新闻接口`POST /api/news/ingest/batch`
- JSON格式请求体：
```
[
  {
    "title": "BTC跌破88000美元，日内下跌1.19%",
    "summary": "欧易OKX行情显示，BTC价格跌破88000美元，现报87972.00美元，日内跌幅1.19%。",
    "coin": "BTC",
    "sentiment": "BEARISH",
    "sourceUrl": "https://www.panewslab.com/zh/articles/520nwvrj",
    "publishedAt": "2025-12-15 22:56"
  },
  {
    "title": "ETH跌破3100美元，日内涨幅0.43%",
    "summary": "欧易OKX行情显示，ETH价格跌破3100美元，现报3097.80美元，日内涨幅0.43%。",
    "coin": "ETH",
    "sentiment": "NEUTRAL",
    "sourceUrl": "https://www.panewslab.com/zh/articles/crxkjzux",
    "publishedAt": "2025-12-15 22:49"
  }
]
```
新增支持批量插入报告数据API`POST /api/reports/batch-insert`
- JSON格式请求体：
```
{
  "report": {
    "id": "R005",
    "generated_at": "2024-12-18 11:00:00",
    "status": "PENDING",
    "ai_judgment": "建议降低 BTC 持仓比例，增加 ETH 配置",
    "risk_level": "MEDIUM"
  },
  "report_changes": [
    {
      "coin": "BTC",
      "current_amount": 2.5,
      "proposed_amount": 2.2,
      "reason": "短期鹰派信号可能对 BTC 造成压力，适度降低仓位"
    },
    {
      "coin": "ETH",
      "current_amount": 15.0,
      "proposed_amount": 18.0,
      "reason": "Layer2 活跃度提升，ETH 基本面向好，建议增持"
    }
  ],
  "report_news": [1, 2, 3]
}
```

## 数据表字段（schema.sql）
### news
- `id` BIGINT PK 自增
- `title` VARCHAR(255)
- `summary` TEXT
- `coin` VARCHAR(20)
- `sentiment` VARCHAR(20)
- `source_url` VARCHAR(500)
- `published_at` DATETIME
- `is_read` TINYINT(1) 默认 0

### portfolio
- `id` BIGINT PK 自增
- `coin` VARCHAR(20) 唯一
- `amount` DECIMAL(18,4)
- `percentage` DECIMAL(6,2)
- `value_usd` DECIMAL(18,2)
- `updated_at` DATETIME

### portfolio_history
- `id` BIGINT PK 自增
- `snap_date` DATE
- `coin` VARCHAR(20)
- `percentage` DECIMAL(6,2)

### report
- `id` VARCHAR(20) PK
- `generated_at` DATETIME
- `status` VARCHAR(20)
- `ai_judgment` TEXT
- `risk_level` VARCHAR(20)
- `review_remark` TEXT

### report_change
- `id` BIGINT PK 自增
- `report_id` VARCHAR(20) FK → report.id
- `coin` VARCHAR(20)
- `current_amount` DECIMAL(18,4)
- `proposed_amount` DECIMAL(18,4)
- `change_pct` DECIMAL(7,2)
- `reason` TEXT

### report_news
- `id` BIGINT PK 自增
- `report_id` VARCHAR(20) FK → report.id
- `news_id` BIGINT FK → news.id

## Dify 提示词要点（复用）
- 币种输出仅限 BTC/ETH/SOL/USDT/UNKNOWN，支持多币种数组（按影响力排序）。
- 情绪输出仅 BULLISH/BEARISH/NEUTRAL。
- 输出必须是 JSON，包含 title, summary, coin, sentiment, sourceUrl, publishedAt, confidence，不要返回多余文本。
