# 后端迁移到自有服务器方案

> 本方案将当前基于 uniCloud 的后端（云函数 + 云数据库）迁移到用户自有服务器，同时保留 UniApp 前端的双端（小程序/H5）兼容。

## 1. 为什么要迁移到自有服务器

| 维度 | uniCloud | 自有服务器 |
|------|----------|-----------|
| 数据控制 | 受限于 DCloud/阿里云 | 完全自主 |
| 调试排错 | 依赖云函数日志 | 本地/服务器日志更灵活 |
| 扩展性 | 受限于云函数规则 | 可自由接入缓存、队列、AI 等 |
| 成本 | 按量计费，流量大时不便宜 | 固定成本，可预测 |
| 部署链路 | HBuilderX 上传或 CLI | GitHub Actions → SSH/容器 |

## 2. 推荐技术栈

- **运行时**: Node.js 18+ LTS
- **框架**: Express 或 NestJS（Express 更轻量，与现有 JS 云函数更接近）
- **数据库**: MySQL 8 / PostgreSQL 15（关系型，便于统计查询）
- **ORM**: Prisma 或 TypeORM
- **认证**: JWT（HS256）
- **文件存储**: 本地目录 + Nginx 静态托管，或接入 MinIO/阿里云 OSS
- **进程管理**: PM2
- **反向代理**: Nginx + HTTPS（Let's Encrypt）
- **CI/CD**: GitHub Actions → SSH/SCP/PM2 deploy

## 3. API 路由设计（对照现有云函数）

| 原云函数 | 新 REST API | 说明 |
|---------|------------|------|
| `user-login` | `POST /api/auth/login` | 微信 `jscode2session`，返回 JWT |
| `user-profile/get` | `GET /api/user/profile` | JWT 鉴权后返回用户信息 |
| `user-profile/update` | `PUT /api/user/profile` | 更新用户资料 |
| `food-record/add` | `POST /api/food-records` | 新增食物记录 |
| `food-record/list` | `GET /api/food-records?date=YYYY-MM-DD` | 按日期查询 |
| `food-record/delete` | `DELETE /api/food-records/:id` | 删除并校验归属 |
| `food-record/stats` | `GET /api/food-records/stats?startDate=&endDate=` | 区间统计 |
| `baidu-dish` | `POST /api/recognize` | 菜品识别代理 |

## 4. 数据库设计

### 4.1 users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(64),
  avatar VARCHAR(512),
  daily_calorie_goal INT DEFAULT 2000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid)
);
```

### 4.2 food_records

```sql
CREATE TABLE food_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  food_name VARCHAR(128) NOT NULL,
  calories DECIMAL(10,2) NOT NULL,
  protein DECIMAL(10,2) DEFAULT 0,
  fat DECIMAL(10,2) DEFAULT 0,
  carbs DECIMAL(10,2) DEFAULT 0,
  image_url VARCHAR(512),
  confidence DECIMAL(5,4) DEFAULT 0,
  meal_type VARCHAR(16) NOT NULL,
  record_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, record_date),
  INDEX idx_created_at (created_at)
);
```

## 5. 认证流程

1. 小程序：`uni.login` 获取 `code`。
2. 前端 `POST /api/auth/login { code }`。
3. 后端用 `code + WX_APPID + WX_SECRET` 请求微信 `jscode2session` 拿到 `openid`。
4. 后端查询/创建用户，生成 JWT 返回。
5. 前端保存 JWT，后续请求在 `Authorization: Bearer <token>` 中携带。
6. H5：当前走匿名模式，可扩展为短信登录 / 微信网页授权。

## 6. 前端适配改造

当前前端通过 `uniCloud.callFunction` 调用云函数。迁移时需要：

1. **新增 API 客户端**
   - 封装 `uni.request`，自动携带 JWT。
   - 统一错误处理、token 刷新。

2. **新增环境变量**
   ```env
   VITE_API_BASE_URL=https://your-domain.com/api
   VITE_USE_SERVER_API=true   # true 走 REST，false 走 uniCloud
   ```

3. **改造 stores**
   - 将 `uniCloud.callFunction` 替换为调用 REST API。
   - 保留 uniCloud 调用逻辑，通过 `VITE_USE_SERVER_API` 切换，便于过渡。

4. **图片上传**
   - 改为 `POST /api/upload` 拿到 URL，再保存记录。

## 7. 推荐部署架构

```
GitHub Actions
     │
     ▼
  build:h5 / build:mp-weixin
     │
     ├──────► 你的服务器 (H5 静态资源 + Node API)
     │            Nginx → PM2 → Express
     │
     └──────► 微信小程序后台 (miniprogram-ci upload)
```

## 8. 服务器目录规划

```
/opt/food-calorie/
├── backend/           # Node.js API
│   ├── src/
│   ├── prisma/        # 或 migrations/
│   ├── uploads/       # 图片上传目录
│   ├── ecosystem.config.js
│   └── .env
├── frontend-h5/       # H5 构建产物
└── logs/
```

## 9. 实施步骤

### Phase 1：搭建后端并跑通登录
1. 在服务器初始化 Node.js + MySQL。
2. 创建 `users`、`food_records` 表。
3. 实现 `/api/auth/login` 和 JWT 中间件。
4. 前端新增 `VITE_USE_SERVER_API` 切换，验证登录。

### Phase 2：迁移 food-record
1. 实现 CRUD + stats 接口。
2. 前端改造 `foodStore`。
3. 数据从 uniCloud 导出并导入 MySQL。

### Phase 3：迁移图片与识别
1. 实现 `/api/upload`。
2. 实现 `/api/recognize` 代理百度 AI。
3. 前端 `result.vue` 改为上传到自有服务器。

### Phase 4：CI/CD 收尾
1. 配置 GitHub Secrets。
2. 完善 `deploy-h5.yml` 和 `deploy-wechat.yml`。
3. 域名 + HTTPS + Nginx 配置。

## 10. 需要补充的信息

为了给你生成可执行的 GitHub Actions 工作流和服务器部署脚本，请确认：

1. 服务器操作系统（Ubuntu / CentOS / 其他）及登录方式（SSH key / 密码）。
2. 服务器上是否已有 Nginx、Node.js、MySQL/PostgreSQL。
3. 你希望后端用 Express 还是 NestJS，数据库用 MySQL 还是 PostgreSQL。
4. H5 部署目录（如 `/var/www/food-calorie/h5`）。
5. 是否有域名和 SSL 证书。
