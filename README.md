# AI 驱动数字货币投资系统
> Dify集成与核心接口、数据表使用指南

## 快速上手
### 1. 数据库初始化
执行项目根目录的 `init.sql` 脚本，自动完成数据库创建、表结构初始化及演示数据填充。

### 2. 启动后端服务
```bash
cd backend # 进入后端项目根目录
mvn spring-boot:run
```
服务默认运行在 **8080** 端口，启动后即可调用API接口。

### 3. 启动前端服务
```bash
cd ui  # 进入前端项目根目录
npm install  # 首次启动需执行安装依赖
npm run dev  # 启动开发服务器
```

### 4. 核心API速览
| 接口类型       | 接口地址                          | 功能描述                     |
|----------------|-----------------------------------|------------------------------|
| 核心入库       | `POST /api/news/ingest`           | 单条新闻入库                 |
| 批量入库       | `POST /api/news/ingest/batch`     | 批量新闻入库                 |
| 新闻查询       | `GET /api/news`                   | 获取新闻列表                 |
| 标记已读       | `POST /api/news/{id}/read`        | 标记单条新闻为已读           |
| 数据指标       | `GET /api/metrics`                | 获取投资市场指标             |
| 投资组合       | `GET /api/portfolio`              | 获取当前投资组合配置         |
| 报告列表       | `GET /api/reports`                | 获取分析报告列表             |
| 报告详情       | `GET /api/reports/{id}`           | 获取单份报告详情             |
| 报告审核       | `POST /api/reports/{id}/approve`  | 审批通过报告                 |
| 报告驳回       | `POST /api/reports/{id}/reject`   | 驳回报告                     |
| 报告创建       | `POST /api/reports`               | 创建单份分析报告             |
| 批量建报告     | `POST /api/reports/batch`         | 批量创建分析报告             |

## Dify 对接接口
### 1. 单条新闻入库
- **请求地址**：`POST /api/news/ingest`
- **请求方式**：JSON POST
- **幂等性**：通过 `title + publishedAt` 做唯一校验，存在则更新，不存在则新增
- **请求参数**：

| 字段         | 类型   | 必填 | 说明                                                                 |
|--------------|--------|------|----------------------------------------------------------------------|
| title        | String | 是   | 新闻标题                                                             |
| summary      | String | 是   | 新闻摘要                                                             |
| coin         | String | 否   | 关联币种，仅支持 BTC/ETH/SOL/USDT（大小写均可）                       |
| sentiment    | String | 否   | 市场情绪，仅支持 BULLISH/BEARISH/NEUTRAL（大小写均可）                |
| sourceUrl    | String | 否   | 新闻来源URL                                                         |
| publishedAt  | String | 否   | 发布时间，格式 `yyyy-MM-dd HH:mm`，缺省为当前系统时间                |

- **响应示例**：
```json
{
  "id": 1001,
  "status": "ok"
}
```

- **调用示例（curl）**：
```bash
curl -X POST http://localhost:8080/api/news/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "BTC现货ETF资金流入创新高",
    "summary": "比特币现货ETF单日资金流入突破10亿美元",
    "coin": "BTC",
    "sentiment": "BULLISH",
    "sourceUrl": "https://example.com/btc-etf",
    "publishedAt": "2025-12-21 10:00"
  }'
```

### 2. 批量新闻入库
- **请求地址**：`POST /api/news/ingest/batch`
- **请求方式**：JSON POST（数组格式）
- **请求示例**：
```json
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

### 3. 分析报告接口
#### 3.1 单条报告创建
- **请求地址**：`POST /api/reports`
- **请求示例**：
```json
{
  "report": {
    "generated_at": "2025-12-18 14:30:00",
    "status": "PENDING",
    "ai_judgment": "市场短期超买，建议收缩高波动资产。",
    "risk_level": "HIGH"
  },
  "report_changes": [
    {
      "coin": "BTC",
      "current_amount": 1.2,
      "proposed_amount": 0.8,
      "reason": "信号偏空"
    }
  ],
  "report_news": [1, 2, 3]
}
```

#### 3.2 批量报告创建
- **请求地址**：`POST /api/reports/batch`
- **请求示例**：
```json
{
  "reports": [
    {
      "report": {
        "generated_at": "2025-12-18 15:45:10",
        "status": "PENDING",
        "ai_judgment": "生态活跃，加仓 SOL。",
        "risk_level": "MEDIUM"
      },
      "report_changes": [
        {
          "coin": "SOL",
          "current_amount": 50.0,
          "proposed_amount": 120.0,
          "reason": "生态爆发"
        }
      ],
      "report_news": [1, 2, 3]
    },
    {
      "report": {
        "generated_at": "2025-12-18 16:20:00",
        "status": "PENDING",
        "ai_judgment": "防御型配置。",
        "risk_level": "LOW"
      },
      "report_changes": [
        {
          "coin": "LINK",
          "current_amount": 200.0,
          "proposed_amount": 300.0,
          "reason": "RWA 稳健"
        }
      ],
      "report_news": [1, 2, 3]
    }
  ]
}
```

## 数据表结构说明
### 1. news（新闻信息表）
存储加密货币相关新闻数据，为AI分析提供基础素材。

| 字段名        | 类型         | 主键/约束       | 说明                     |
|---------------|--------------|-----------------|--------------------------|
| id            | BIGINT       | PK，自增        | 新闻唯一标识             |
| title         | VARCHAR(255) | -               | 新闻标题                 |
| summary       | TEXT         | -               | 新闻摘要                 |
| coin          | VARCHAR(20)  | -               | 关联币种（BTC/ETH等）|
| sentiment     | VARCHAR(20)  | -               | 市场情绪（多空/中性）|
| source_url    | VARCHAR(500) | 默认：example.com | 新闻来源URL              |
| published_at  | DATETIME     | -               | 发布时间                 |
| is_read       | TINYINT(1)   | 默认0（未读）| 是否已读标记             |

### 2. portfolio（投资组合表）
存储当前持有的加密货币投资组合配置。

| 字段名        | 类型             | 主键/约束       | 说明                     |
|---------------|------------------|-----------------|--------------------------|
| id            | BIGINT           | PK，自增        | 记录唯一标识             |
| coin          | VARCHAR(20)      | 唯一索引        | 加密货币币种             |
| amount        | DECIMAL(18,4)    | -               | 持有数量                 |
| percentage    | DECIMAL(6,2)     | -               | 占总组合的百分比         |
| value_usd     | DECIMAL(18,2)    | -               | 美元价值                 |
| updated_at    | DATETIME         | -               | 最后更新时间             |

### 3. portfolio_history（投资组合历史表）
存储投资组合的历史快照数据，用于趋势分析。

| 字段名        | 类型             | 主键/约束       | 说明                     |
|---------------|------------------|-----------------|--------------------------|
| id            | BIGINT           | PK，自增        | 记录唯一标识             |
| snap_date     | DATE             | -               | 快照日期                 |
| coin          | VARCHAR(20)      | -               | 加密货币币种             |
| percentage    | DECIMAL(6,2)     | -               | 当日占比                 |

### 4. report（分析报告表）
存储AI生成的投资分析报告主数据。

| 字段名        | 类型         | 主键/约束       | 说明                     |
|---------------|--------------|-----------------|--------------------------|
| id            | BIGINT       | PK，自增        | 报告唯一标识             |
| generated_at  | DATETIME     | -               | 报告生成时间             |
| status        | VARCHAR(20)  | -               | 报告状态（PENDING等）|
| ai_judgment   | TEXT         | -               | AI分析结论               |
| risk_level    | VARCHAR(20)  | -               | 风险等级（HIGH/MEDIUM/LOW） |
| review_remark | TEXT         | -               | 人工审核备注             |

### 5. report_change（报告调仓建议表）
存储报告中针对各币种的调仓建议详情。

| 字段名            | 类型             | 主键/约束       | 说明                     |
|-------------------|------------------|-----------------|--------------------------|
| id                | BIGINT           | PK，自增        | 记录唯一标识             |
| report_id         | BIGINT           | FK → report.id  | 关联报告ID               |
| coin              | VARCHAR(20)      | -               | 加密货币币种             |
| current_amount    | DECIMAL(18,4)    | -               | 当前持有数量             |
| proposed_amount   | DECIMAL(18,4)    | -               | 建议持有数量             |
| change_pct        | DECIMAL(7,2)     | -               | 变动百分比               |
| reason            | TEXT             | -               | 调仓原因                 |

### 6. report_news（报告新闻关联表）
建立分析报告与参考新闻的多对多关联关系。

| 字段名        | 类型         | 主键/约束       | 说明                     |
|---------------|--------------|-----------------|--------------------------|
| id            | BIGINT       | PK，自增        | 关联记录唯一标识         |
| report_id     | BIGINT       | FK → report.id  | 关联报告ID               |
| news_id       | BIGINT       | FK → news.id    | 关联新闻ID               |

## Dify 提示词规范
为保证Dify输出数据的规范性和可解析性，需遵循以下提示词规则：
1. **币种限制**：输出币种仅限 `BTC/ETH/SOL/USDT/UNKNOWN`，支持多币种数组（按影响力排序）。
2. **情绪限制**：市场情绪仅允许输出 `BULLISH（看涨）/BEARISH（看跌）/NEUTRAL（中性）`。
3. **输出格式**：必须返回JSON格式，包含字段 `title, summary, coin, sentiment, sourceUrl, publishedAt, confidence`，禁止返回多余文本。
4. **置信度**：`confidence` 字段需返回0-1的数值，代表AI判断的置信程度。