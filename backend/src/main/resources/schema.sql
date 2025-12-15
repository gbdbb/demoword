CREATE TABLE IF NOT EXISTS news (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    summary TEXT,
    coin VARCHAR(20),
    sentiment VARCHAR(20),
    source_url VARCHAR(500),
    published_at DATETIME,
    is_read TINYINT(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    coin VARCHAR(20) UNIQUE,
    amount DECIMAL(18,4),
    percentage DECIMAL(6,2),
    value_usd DECIMAL(18,2),
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS portfolio_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snap_date DATE,
    coin VARCHAR(20),
    percentage DECIMAL(6,2)
);

CREATE TABLE IF NOT EXISTS report (
    id VARCHAR(20) PRIMARY KEY,
    generated_at DATETIME,
    status VARCHAR(20),
    ai_judgment TEXT,
    risk_level VARCHAR(20),
    review_remark TEXT
);

CREATE TABLE IF NOT EXISTS report_change (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(20),
    coin VARCHAR(20),
    current_amount DECIMAL(18,4),
    proposed_amount DECIMAL(18,4),
    change_pct DECIMAL(7,2),
    reason TEXT,
    CONSTRAINT fk_report_change_report FOREIGN KEY (report_id) REFERENCES report(id)
);

CREATE TABLE IF NOT EXISTS report_news (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    report_id VARCHAR(20),
    news_id BIGINT,
    CONSTRAINT fk_report_news_report FOREIGN KEY (report_id) REFERENCES report(id),
    CONSTRAINT fk_report_news_news FOREIGN KEY (news_id) REFERENCES news(id)
);
