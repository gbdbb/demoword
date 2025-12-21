# AI驱动数字货币投资系统

## 项目概述

AI驱动数字货币投资系统是一款结合市场行情、AI智能分析与风险控制的现代化投资管理平台。系统通过整合数字货币新闻、投资组合数据和AI生成的分析报告，为用户提供全面的投资决策支持。

## 技术栈

### 后端
- **框架**：Spring Boot 3.3.5
- **数据库**：MySQL 8.0
- **ORM**：Spring Data JPA
- **构建工具**：Maven
- **Java版本**：JDK 17

### 前端
- **框架**：React 19.2.3
- **构建工具**：Vite 7.2.4
- **UI组件库**：Ant Design 6.1.0
- **图表库**：Recharts 3.5.1
- **开发语言**：TypeScript 5.9.3

## 项目结构

```
├── backend/                  # 后端Spring Boot项目
│   ├── src/                 # 后端源代码
│   │   └── main/            # 主代码目录
│   │       ├── java/        # Java源代码
│   │       └── resources/   # 配置文件
│   └── pom.xml              # Maven依赖配置
├── ui/                      # 前端Vite项目
│   ├── src/                 # 前端源代码
│   │   ├── components/      # React组件
│   │   └── App.tsx          # 应用入口
│   ├── package.json         # NPM依赖配置
│   └── vite.config.ts       # Vite配置
├── init.sql                 # 数据库初始化脚本
└── README.md                # 项目说明文档
```

## 核心功能

### 1. 系统概览
- 实时显示未读新闻数量、待审批报告数量和总资产价值
- 提供系统整体运行状态监控

### 2. 消息列表
- 展示加密货币相关新闻，支持按币种、市场情绪筛选
- 标记新闻已读状态，支持分页浏览
- 显示新闻标题、摘要、来源、发布时间等信息

### 3. 持仓数据
- 实时展示当前投资组合持仓情况，包括各币种的数量、占比和价值
- 提供投资组合历史变化趋势图表
- 支持导出投资组合数据

### 4. AI建议报告
- 展示AI生成的投资分析报告列表
- 提供报告详情查看，包括AI判断、风险等级、调仓建议等
- 支持报告审批（通过/驳回）功能

## 快速开始指南

### 1. 环境准备
- JDK 17+
- Node.js 18+
- MySQL 8.0+

### 2. 数据库初始化

```bash
# 执行数据库初始化脚本
mysql -u root -p < init.sql
```

该脚本将：
- 创建名为`ai`的数据库
- 创建所有必要的数据表
- 插入初始演示数据

### 3. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端服务将在`http://localhost:8080`启动。

### 4. 启动前端服务

```bash
cd ui
npm install  # 首次启动需安装依赖
npm run dev  # 启动开发服务器
```

前端服务将在`http://localhost:5173`启动。

### 5. 登录系统

使用以下默认账号登录系统：
- **普通用户**：用户名`demo`，密码`123456`
- **管理员**：用户名`admin`，密码`123456`

## API接口说明

### 核心接口

| 接口类型       | 接口地址                          | 功能描述                     |
|----------------|-----------------------------------|------------------------------|
| 认证接口       | `POST /api/auth/login`            | 用户登录                     |
| 认证接口       | `POST /api/auth/logout`           | 用户登出                     |
| 新闻接口       | `GET /api/news`                   | 获取新闻列表                 |
| 新闻接口       | `POST /api/news/{id}/read`        | 标记新闻为已读               |
| 投资组合接口   | `GET /api/portfolio`              | 获取投资组合数据             |
| 报告接口       | `GET /api/reports`                | 获取报告列表                 |
| 报告接口       | `GET /api/reports/{id}`           | 获取报告详情                 |
| 报告接口       | `POST /api/reports/{id}/approve`  | 审批通过报告                 |
| 报告接口       | `POST /api/reports/{id}/reject`   | 驳回报告                     |

### 支持的数据格式

- 所有API接口均使用JSON格式进行数据交换
- 请求和响应数据都经过严格的类型检查和验证

## 数据库结构

### 主要数据表

1. **news**：存储加密货币相关新闻数据
2. **user**：存储用户信息
3. **role**：存储角色信息
4. **user_role**：存储用户角色关联
5. **portfolio**：存储当前投资组合数据
6. **portfolio_history**：存储投资组合历史数据
7. **report**：存储AI生成的分析报告
8. **report_change**：存储报告建议的调仓操作
9. **report_news**：存储报告与新闻的关联

## 系统特色

### 1. AI驱动分析
- 结合市场新闻和投资数据生成智能分析报告
- 提供基于AI判断的投资组合调整建议

### 2. 完善的权限管理
- 支持普通用户和管理员两种角色
- 管理员可审批AI生成的投资建议

### 3. 实时数据展示
- 动态显示投资组合价值变化
- 提供历史数据趋势分析

## 配置说明

### 后端配置

后端配置文件位于`backend/src/main/resources/application.yml`，主要配置项包括：

- 服务器端口
- 数据库连接信息
- JPA配置

### 前端配置

前端API基础地址通过环境变量`VITE_API_BASE`配置，默认值为`http://localhost:8080/api`。

在前端项目的`src/api.ts`文件中定义：
```typescript
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
```

如需修改API地址，可以通过构建时设置环境变量或直接修改默认值。

## 开发说明

### 后端开发

```bash
# 编译项目
mvn compile

# 运行测试
mvn test

# 打包项目
mvn package
```

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署说明

### 后端部署

1. 编译生成jar包：`mvn package`
2. 执行jar包：`java -jar target/ai-backend-0.0.1-SNAPSHOT.jar`

### 前端部署

1. 构建生产版本：`npm run build`
2. 将`dist`目录部署到Web服务器（如Nginx、Apache）

## 注意事项

1. 系统默认使用简单的密码存储方式，生产环境中应使用更安全的加密方式
2. 定期备份数据库以防止数据丢失
3. 根据实际需求调整系统配置参数

## 联系方式

如有问题或建议，请联系项目维护团队。

---

© 2025 AI驱动数字货币投资系统 | All Rights Reserved
