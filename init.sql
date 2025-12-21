-- 加密货币AI投资分析系统数据库初始化脚本
-- 兼容MySQL 5.5/5.6/5.7/8.0
-- 包含创建数据库、表结构和初始数据

-- 创建数据库（如果不存在）
-- 改用兼容的utf8mb4通用排序规则 utf8mb4_general_ci（全版本支持）
CREATE DATABASE IF NOT EXISTS ai CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE ai;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 创建表结构
DROP TABLE IF EXISTS report_news;
DROP TABLE IF EXISTS report_change;
DROP TABLE IF EXISTS report;
DROP TABLE IF EXISTS portfolio_history;
DROP TABLE IF EXISTS portfolio;
DROP TABLE IF EXISTS news;

-- news表 - 存储新闻信息
CREATE TABLE news (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255),
    summary TEXT,
    coin VARCHAR(20),
    sentiment VARCHAR(20),
    source_url VARCHAR(500),
    published_at DATETIME,
    is_read TINYINT(1) DEFAULT 0 COMMENT '0=未读,1=已读',
    PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- portfolio表 - 存储投资组合
CREATE TABLE portfolio (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coin VARCHAR(20),
    amount DECIMAL(18,4),
    percentage DECIMAL(6,2),
    value_usd DECIMAL(18,2),
    updated_at DATETIME,
    PRIMARY KEY (id),
    UNIQUE INDEX coin (coin)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- portfolio_history表 - 存储投资组合历史
CREATE TABLE portfolio_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    snap_date DATE,
    coin VARCHAR(20),
    percentage DECIMAL(6,2),
    PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- report表 - 存储分析报告
CREATE TABLE report (
    id BIGINT NOT NULL AUTO_INCREMENT,
    generated_at DATETIME,
    status VARCHAR(20),
    ai_judgment TEXT,
    risk_level VARCHAR(20),
    review_remark TEXT,
    PRIMARY KEY (id)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- report_change表 - 存储报告建议的调仓操作
CREATE TABLE report_change (
    id BIGINT NOT NULL AUTO_INCREMENT,
    coin VARCHAR(20),
    current_amount DECIMAL(18,4),
    proposed_amount DECIMAL(18,4),
    change_pct DECIMAL(7,2),
    reason TEXT,
    report_id BIGINT,
    PRIMARY KEY (id),
    INDEX fk_report_change_report (report_id),
    -- 改用NO ACTION替代RESTRICT，兼容低版本
    CONSTRAINT fk_report_change_report FOREIGN KEY (report_id) REFERENCES report (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- report_news表 - 存储报告与新闻的关联
CREATE TABLE report_news (
    id BIGINT NOT NULL AUTO_INCREMENT,
    news_id BIGINT,
    report_id BIGINT,
    PRIMARY KEY (id),
    INDEX fk_report_news_news (news_id),
    INDEX fk_report_news_report (report_id),
    CONSTRAINT fk_report_news_news FOREIGN KEY (news_id) REFERENCES news (id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT fk_report_news_report FOREIGN KEY (report_id) REFERENCES report (id) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- 插入初始数据
-- 移除自增列的显式值，让数据库自动生成（更规范，避免冲突）
INSERT INTO news (title, summary, coin, sentiment, source_url, published_at, is_read) VALUES 
('MicroStrategy 增持 1.5 亿美元比特币', '机构需求持续支撑比特币。', 'BTC', 'BULLISH', 'https://example.com/', '2025-12-21 01:33:30', 0),
('以太坊 Layer2 交易量创历史新高', '随着 Layer2 使用率增长，链上活动攀升。', 'ETH', 'BULLISH', 'https://example.com/', '2025-12-21 01:33:30', 0),
('美联储鹰派论调对 Bitcoin 构成压力', '鹰派言论可能给 Bitcoin 带来短期压力。', 'BTC', 'BEARISH', 'https://example.com/', '2025-12-21 01:33:30', 0),
('Solana 去中心化金融总锁仓量突破 50 亿美元', '生态系统总锁仓量突破 50 亿美元，去中心化金融增长加速。', 'SOL', 'BULLISH', 'https://example.com/', '2025-12-21 01:33:30', 0),
('以太坊 gas 费回落', 'Gas 费降至近期低点，网络使用成本改善。', 'ETH', 'NEUTRAL', 'https://example.com/', '2025-12-21 01:33:30', 0),
('比特币现货 ETF 资金流入放缓', '现货 ETF 资金流入连续三天放缓，市场情绪降温。', 'BTC', 'NEUTRAL', 'https://example.com/', '2025-12-21 01:33:30', 0),
('Solana 网络出现延迟', '短暂的网络延迟引发对稳定性的担忧。', 'SOL', 'BEARISH', 'https://example.com/', '2025-12-21 01:33:30', 0),
('GBTC 折让收窄', 'GBTC 折让收窄至 5% 以下，市场信心有所改善。', 'BTC', 'BULLISH', 'https://example.com/', '2025-12-21 01:33:30', 0);

INSERT INTO portfolio (coin, amount, percentage, value_usd, updated_at) VALUES 
('BTC', 2.5000, 63.08, 220997.50, '2025-12-22 02:59:57'),
('ETH', 15.0000, 12.78, 44790.00, '2025-12-22 02:59:57'),
('SOL', 500.0000, 17.86, 62560.00, '2025-12-22 02:59:57'),
('USDT', 22000.0000, 6.28, 21993.84, '2025-12-22 02:59:57');

INSERT INTO portfolio_history (snap_date, coin, percentage) VALUES 
('2025-12-15', 'BTC', 42.00), ('2025-12-15', 'ETH', 26.00), ('2025-12-15', 'SOL', 20.00), ('2025-12-15', 'USDT', 12.00),
('2025-12-16', 'BTC', 43.00), ('2025-12-16', 'ETH', 27.00), ('2025-12-16', 'SOL', 19.00), ('2025-12-16', 'USDT', 11.00),
('2025-12-17', 'BTC', 44.00), ('2025-12-17', 'ETH', 28.00), ('2025-12-17', 'SOL', 18.00), ('2025-12-17', 'USDT', 10.00),
('2025-12-18', 'BTC', 45.00), ('2025-12-18', 'ETH', 27.00), ('2025-12-18', 'SOL', 18.00), ('2025-12-18', 'USDT', 10.00),
('2025-12-19', 'BTC', 46.00), ('2025-12-19', 'ETH', 27.00), ('2025-12-19', 'SOL', 17.00), ('2025-12-19', 'USDT', 10.00),
('2025-12-20', 'BTC', 45.00), ('2025-12-20', 'ETH', 28.00), ('2025-12-20', 'SOL', 18.00), ('2025-12-20', 'USDT', 9.00),
('2025-12-21', 'BTC', 45.00), ('2025-12-21', 'ETH', 28.00), ('2025-12-21', 'SOL', 18.00), ('2025-12-21', 'USDT', 9.00),
('2025-12-22', 'BTC', 63.08), ('2025-12-22', 'ETH', 12.78), ('2025-12-22', 'SOL', 17.86), ('2025-12-22', 'USDT', 6.28);

INSERT INTO report (generated_at, status, ai_judgment, risk_level, review_remark) VALUES 
('2024-12-16 09:00:00', 'PENDING', 'BTC机构增持与波动率并存，ETH质押与L2双利好，SOL生态增长但需警惕技术风险，USDT需求旺盛维持储备，整体持仓保持不变。', 'MEDIUM', NULL),
('2024-12-15 09:00:00', 'PENDING', 'SOL生态爆发式增长，建议小幅增持；ETH L2与质押双利好，维持持仓；BTC暂观机构动向。', 'MEDIUM', NULL),
('2024-12-14 09:00:00', 'PENDING', '美联储降息预期升温（新闻3），USDT需求上涨（新闻6），建议小幅增加稳定币储备；BTC、ETH暂无明确信号，维持持仓。', 'LOW', NULL);

INSERT INTO report_change (coin, current_amount, proposed_amount, change_pct, reason, report_id) VALUES 
('BTC', 2.5000, 2.5000, 0.00, 'MicroStrategy增持BTC（新闻1）带来机构支撑，但期货未平仓合约新高（新闻7）增加波动率，暂维持持仓', 1),
('ETH', 15.0000, 15.0000, 0.00, 'L2交易量破千亿（新闻2）+质押量超3000万枚（新闻8），双利好支撑持仓，无需调整', 1),
('SOL', 500.0000, 500.0000, 0.00, 'DeFi TVL突破50亿（新闻4）但网络曾拥堵（新闻5），技术风险与生态增长抵消，暂不调仓', 1),
('USDT', 22000.0000, 22000.0000, 0.00, '市值破9000亿（新闻6）+美联储降息预期（新闻3），稳定币储备需求旺盛，维持现有仓位', 1),
('SOL', 500.0000, 550.0000, 11.10, 'SOL DeFi TVL突破50亿美元（新闻4），生态增长超预期，建议增持50枚', 2),
('ETH', 15.0000, 15.0000, 0.00, 'ETH L2交易量创新高（新闻2），质押收益稳定（新闻8），持仓合理', 2),
('BTC', 2.5000, 2.5000, 0.00, 'MicroStrategy增持消息（新闻1）需观察后续机构跟进情况，暂不调整', 2),
('USDT', 22000.0000, 24000.0000, 10.00, '美联储释放降息信号（新闻3）推升市场流动性，USDT市值破9000亿（新闻6），建议增持2000枚作为储备', 3),
('BTC', 2.5000, 2.5000, 0.00, '暂未出现明确的趋势性信号，维持基础持仓', 3),
('ETH', 15.0000, 15.0000, 0.00, 'L2生态处于稳步增长阶段，暂无调仓必要', 3);

INSERT INTO report_news (news_id, report_id) VALUES 
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1),
(1, 2), (2, 2), (4, 2), (8, 2),
(3, 3), (6, 3);

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;