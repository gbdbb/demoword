SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE report_news;
TRUNCATE TABLE report_change;
TRUNCATE TABLE report;
TRUNCATE TABLE portfolio_history;
TRUNCATE TABLE portfolio;
TRUNCATE TABLE news;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO news (title, summary, coin, sentiment, source_url, published_at, is_read) VALUES
('MicroStrategy 再次购入 1.5 亿美元比特币', 'MicroStrategy 再次购入 1.5 亿美元比特币，机构持续增持信号明确', 'BTC', 'BULLISH', 'https://example.com/news/1', '2024-12-14 10:30:00', 0),
('以太坊与 Layer2 交易量创新高', '以太坊与 Layer2 交易量创新高，链上活跃度持续提升', 'ETH', 'BULLISH', 'https://example.com/news/2', '2024-12-14 09:15:00', 0),
('美联储鹰派信号或施压 BTC', '美联储官员释放鹰派信号，短期内加密市场可能承压', 'BTC', 'BEARISH', 'https://example.com/news/3', '2024-12-14 08:45:00', 1),
('Solana 生态 TVL 突破 50 亿美元', 'Solana 生态 TVL 突破 50 亿美元，DeFi 增长势头强劲', 'SOL', 'BULLISH', 'https://example.com/news/4', '2024-12-13 16:20:00', 0),
('以太坊 Gas 费用回落', '以太坊 Gas 费用回落至近月低点，网络使用成本优化', 'ETH', 'NEUTRAL', 'https://example.com/news/5', '2024-12-13 14:30:00', 1),
('比特币现货 ETF 资金流入放缓', '比特币现货 ETF 连续三日资金流入放缓，市场观望情绪升温', 'BTC', 'NEUTRAL', 'https://example.com/news/6', '2024-12-13 11:00:00', 0),
('Solana 网络短暂延迟', 'Solana 网络出现短暂延迟，技术稳定性再获关注', 'SOL', 'BEARISH', 'https://example.com/news/7', '2024-12-12 18:00:00', 1),
('灰度比特币信托折价率收窄', '灰度比特币信托折价率收窄至 5% 以下，市场情绪回暖', 'BTC', 'BULLISH', 'https://example.com/news/8', '2024-12-12 15:30:00', 1);

INSERT INTO portfolio (coin, amount, percentage, value_usd, updated_at) VALUES
('BTC', 2.5, 45.00, 110250, NOW()),
('ETH', 15, 28.00, 68600, NOW()),
('SOL', 500, 18.00, 44100, NOW()),
('USDT', 22000, 9.00, 22000, NOW());

INSERT INTO portfolio_history (snap_date, coin, percentage) VALUES
('2024-12-08', 'BTC', 42.00),
('2024-12-08', 'ETH', 26.00),
('2024-12-08', 'SOL', 20.00),
('2024-12-08', 'USDT', 12.00),
('2024-12-09', 'BTC', 43.00),
('2024-12-09', 'ETH', 27.00),
('2024-12-09', 'SOL', 19.00),
('2024-12-09', 'USDT', 11.00),
('2024-12-10', 'BTC', 44.00),
('2024-12-10', 'ETH', 28.00),
('2024-12-10', 'SOL', 18.00),
('2024-12-10', 'USDT', 10.00),
('2024-12-11', 'BTC', 45.00),
('2024-12-11', 'ETH', 27.00),
('2024-12-11', 'SOL', 18.00),
('2024-12-11', 'USDT', 10.00),
('2024-12-12', 'BTC', 46.00),
('2024-12-12', 'ETH', 27.00),
('2024-12-12', 'SOL', 17.00),
('2024-12-12', 'USDT', 10.00),
('2024-12-13', 'BTC', 45.00),
('2024-12-13', 'ETH', 28.00),
('2024-12-13', 'SOL', 18.00),
('2024-12-13', 'USDT', 9.00),
('2024-12-14', 'BTC', 45.00),
('2024-12-14', 'ETH', 28.00),
('2024-12-14', 'SOL', 18.00),
('2024-12-14', 'USDT', 9.00);

INSERT INTO report (id, generated_at, status, ai_judgment, risk_level) VALUES
('R001', '2024-12-14 11:00:00', 'PENDING', '建议降低 BTC 持仓比例，增加 ETH 配置', 'MEDIUM'),
('R002', '2024-12-13 14:00:00', 'APPROVED', '市场情绪稳定，维持现有配置', 'LOW'),
('R003', '2024-12-12 16:30:00', 'REJECTED', '建议大幅增持 SOL', 'HIGH');

INSERT INTO report_change (report_id, coin, current_amount, proposed_amount, change_pct, reason) VALUES
('R001', 'BTC', 2.5, 2.2, -12.0, '短期鹰派信号可能对 BTC 造成压力，适度降低仓位'),
('R001', 'ETH', 15, 18, 20.0, 'Layer2 活跃度提升，ETH 基本面向好，建议增持'),
('R001', 'SOL', 500, 500, 0.0, '保持现有仓位，观察生态发展'),
('R001', 'USDT', 22000, 15000, -31.8, '降低现金持有比例，优化资金利用效率'),
('R003', 'SOL', 500, 800, 60.0, '生态 TVL 快速增长，但需关注技术稳定性');

INSERT INTO report_news (report_id, news_id) VALUES
('R001', 1), ('R001', 2), ('R001', 3),
('R002', 4), ('R002', 5), ('R002', 6),
('R003', 7), ('R003', 8);
