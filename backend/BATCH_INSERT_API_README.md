# 报告数据批量插入API文档

## 概述
本API用于将报告主记录、报告变更建议、报告新闻关联数据批量写入MySQL数据库，确保数据一致性和完整性。

## API详情

### 请求路径
```
POST /api/report/batch-insert
```

### 请求格式
Content-Type: application/json

### 请求体结构
```json
{
  "report": {
    "id": "R001",
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
      "current_amount": 15,
      "proposed_amount": 18,
      "reason": "Layer2 活跃度提升，ETH 基本面向好，建议增持"
    }
  ],
  "report_news": [1, 2, 3]
}
```

### 响应格式

#### 成功响应 (200)
```json
{
  "code": 200,
  "msg": "数据插入成功",
  "data": {
    "report_id": "R001"
  }
}
```

#### 失败响应 (400 - 数据校验失败)
```json
{
  "code": 400,
  "msg": "具体失败原因",
  "data": null
}
```

#### 失败响应 (500 - 数据库异常)
```json
{
  "code": 500,
  "msg": "数据库异常: 具体错误信息",
  "data": null
}
```

## 字段校验规则

### report字段
- `id`: 必填，必须符合格式"R"+数字，如"R001"
- `generated_at`: 必填，格式为"yyyy-MM-dd HH:mm:ss"
- `status`: 必填，仅允许PENDING/APPROVED/REJECTED
- `ai_judgment`: 必填，文本内容
- `risk_level`: 必填，仅允许LOW/MEDIUM/HIGH

### report_changes字段
- `coin`: 必填，币种代码
- `current_amount`: 必填，必须大于0
- `proposed_amount`: 必填，必须大于0
- `reason`: 必填，变更原因

### report_news字段
- 数组中的每个元素必须是存在的新闻ID

## 自动计算字段
- `change_pct`: 自动计算，公式为(proposed_amount - current_amount) / current_amount * 100，保留1位小数

## 数据库事务
- 三个表(report、report_change、report_news)的写入在同一个事务中执行
- 任何步骤失败都会导致整个操作回滚，确保数据一致性

## 测试示例
项目根目录下提供了测试脚本：
- Linux/Mac: `test_batch_insert.sh`
- Windows: `test_batch_insert.bat`

测试脚本包含以下测试用例：
1. 正常插入数据
2. 重复插入相同report_id (应返回400错误)
3. 非法状态值 (应返回400错误)
4. 非法风险等级 (应返回400错误)
5. current_amount为0 (应返回400错误)
6. 检查change_pct计算是否正确

## 启动项目
1. 确保MySQL数据库已启动，且已创建相应的表结构
2. 执行以下命令启动Spring Boot应用：
```bash
mvn spring-boot:run
```
3. 应用将在http://localhost:8080启动

## 潜在异常场景及处理

### 1. report_id重复
- **场景**: 插入已存在的report_id
- **处理**: 返回400错误，提示"报告ID已存在: R001"

### 2. 外键约束失败
- **场景**: 引用不存在的news_id
- **处理**: 返回400错误，提示"新闻ID不存在: xxx"

### 3. 数值计算除零
- **场景**: current_amount为0
- **处理**: 返回400错误，提示"币种 xxx 的当前持仓量不能为0"

### 4. 字段校验失败
- **场景**: status或risk_level传入非法值
- **处理**: 返回400错误，提示相应的验证失败信息

### 5. 数据库连接异常
- **场景**: 数据库连接问题或SQL执行错误
- **处理**: 返回500错误，提示"数据库异常: xxx"

## 使用建议
1. 在调用API前，先确保所有关联的新闻ID存在于数据库中
2. 使用合适的report_id命名规则，避免冲突
3. 在批量操作中，建议监控API响应，确保操作成功
4. 对于大量数据插入，考虑分批处理，避免事务过大