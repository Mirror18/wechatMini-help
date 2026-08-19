# 后端请求实际可执行方案

> 本文档面向 UniApp + uniCloud（阿里云）项目 `food-calorie-miniapp`，说明当前后端架构、各云函数作用、部署配置步骤以及 H5/小程序双端的请求策略。

## 1. 后端架构概览

后端全部基于 **uniCloud 云函数**（Node.js，部署在阿里云），无独立服务器。整体交互流程：

```
┌─────────────────┐     uniCloud.callFunction      ┌──────────────────────┐
│   UniApp 前端    │  ───────────────────────────>  │   uniCloud 云函数    │
│  (Vue3 + Pinia)  │                               │   (Node.js/阿里云)   │
└─────────────────┘     { code, message, data }     └──────────────────────┘
                              <───────────────────────────┘

云函数列表：
- food-record   食物记录增删改查 + 统计
- user-login    微信小程序 jscode2session 登录
- user-profile  用户资料读写
- baidu-dish    菜品识别代理（新增）
```

### 1.1 统一响应格式

所有云函数统一返回：

```json
{
  "code": 0,          // 0 成功；负数或 401 为异常
  "message": "...",   // 提示文案
  "data": { ... }     // 业务数据
}
```

前端 `uniCloud.callFunction` 拿到的结构为 `{ result: { code, message, data } }`，因此 Pinia 中已全部改为先判断 `result.code` 再取 `result.data`。

## 2. 云函数清单与接口说明

### 2.1 food-record（食物记录）

位置：`uniCloud-aliyun/cloudfunctions/food-record/index.js`

| action | 参数 | 说明 |
|--------|------|------|
| `add` | `record: FoodRecord` | 新增记录；云端强制使用 `context.auth.OPENID` 作为 `userId` |
| `list` | `date: 'YYYY-MM-DD'` | 查询某日期记录，按创建时间倒序 |
| `delete` | `id: string` | 删除记录，先校验记录归属再删除 |
| `stats` | `startDate, endDate` | 区间统计：总热量、日均、三大营养素、每日热量分布 |

**权限**：所有 action 必须已登录（`context.auth.OPENID` 存在），否则返回 `401`。

### 2.2 user-login（微信登录）

位置：`uniCloud-aliyun/cloudfunctions/user-login/index.js`

| 参数 | 说明 |
|------|------|
| `code` | 小程序 `uni.login` 拿到的 js_code |

流程：
1. 用 `code + WX_APPID + WX_SECRET` 请求微信 `jscode2session`。
2. 拿到 `openid` 后查询/创建 `users` 集合记录。
3. 返回 `{ openid, session_key }`。

### 2.3 user-profile（用户资料）

位置：`uniCloud-aliyun/cloudfunctions/user-profile/index.js`

| action | 参数 | 说明 |
|--------|------|------|
| `get` | - | 返回当前 `OPENID` 对应的用户资料 |
| `update` | `nickname, avatar, dailyCalorieGoal` | 更新用户资料 |

### 2.4 baidu-dish（新增：菜品识别代理）

位置：`uniCloud-aliyun/cloudfunctions/baidu-dish/index.js`

| 参数 | 说明 |
|------|------|
| `image` | 图片 Base64（去掉 `data:image/...` 前缀） |
| `topNum` | 返回候选数量，默认 5 |
| `filterThreshold` | 置信度过滤阈值，默认 0.7 |

作用：
- 在服务端保管百度 AI `API Key / Secret Key`，避免 H5 前端暴露密钥。
- 解决 H5 浏览器直接请求百度接口的 CORS 问题。
- 小程序端仍可直接请求百度接口以节省云函数调用次数；也可通过环境变量 `VITE_BAIDU_AI_USE_CLOUD_PROXY=true` 强制走代理。

## 3. 环境变量配置

### 3.1 前端 `.env.local`（Vite 构建时注入）

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填写：

```env
# 百度AI配置（小程序端直接请求时使用；H5 默认走云函数代理，此配置可留空但建议填写以便本地开发）
VITE_BAIDU_AI_API_KEY=your_api_key
VITE_BAIDU_AI_SECRET_KEY=your_secret
# 是否强制所有平台都走 baidu-dish 云函数代理
VITE_BAIDU_AI_USE_CLOUD_PROXY=false

# uniCloud 空间配置
UNICLOUD_SPACE_ID=your_space_id
UNICLOUD_SPACE_PROVIDER=aliyun
```

### 3.2 云函数环境变量（uniCloud 控制台/DB 配置）

在云函数详情页 → 云函数配置 → 环境变量中配置：

| 变量名 | 用途 | 所属云函数 |
|--------|------|-----------|
| `WX_APPID` | 微信小程序 AppID | `user-login` |
| `WX_SECRET` | 微信小程序 AppSecret | `user-login` |
| `BAIDU_API_KEY` | 百度 AI API Key | `baidu-dish` |
| `BAIDU_SECRET_KEY` | 百度 AI Secret Key | `baidu-dish` |

> 注意：不要把微信/百度密钥写进前端 `.env.local` 或代码仓库。

## 4. 数据库集合（uniCloud 数据库）

需要在 uniCloud 控制台 → 数据库中创建以下集合：

### 4.1 food_records

```json
{
  "userId": "string",      // OPENID
  "foodName": "string",
  "calories": "number",
  "protein": "number",
  "fat": "number",
  "carbs": "number",
  "imageUrl": "string",    // 云存储 fileID 或临时路径
  "confidence": "number",
  "mealType": "string",    // breakfast/lunch/dinner/snack
  "date": "string",        // YYYY-MM-DD
  "createdAt": "Date"
}
```

### 4.2 users

```json
{
  "openid": "string",
  "nickname": "string",
  "avatar": "string",
  "dailyCalorieGoal": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 5. 部署步骤（实际可执行）

### 5.1 首次部署

1. **创建 uniCloud 空间**
   - 登录 [DCloud 开发者中心](https://dev.dcloud.net.cn/)。
   - 创建阿里云空间，记录 `UNICLOUD_SPACE_ID`。

2. **关联项目**
   - 在 HBuilderX 中右键 `uniCloud-aliyun` → 关联云服务空间 → 选择刚创建的空间。
   - 或在项目根目录 `.env.local` 中配置 `UNICLOUD_SPACE_ID` 和 `UNICLOUD_SPACE_PROVIDER`。

3. **创建数据库集合**
   - 进入云服务空间 → 数据库 → 新建集合 `food_records`、`users`。

4. **配置云函数环境变量**
   - 进入每个云函数详情页，填写第 3.2 节表格中的环境变量。

5. **上传并部署云函数**
   - HBuilderX：右键 `food-record` / `user-login` / `user-profile` / `baidu-dish` → 上传部署（含公共模块）。
   - 部署成功后可在「云函数列表」看到运行状态。

6. **前端配置**
   - 复制 `.env.example` → `.env.local`，填写 `VITE_BAIDU_AI_API_KEY`、`VITE_BAIDU_AI_SECRET_KEY`、`UNICLOUD_SPACE_ID`。

7. **运行/构建**
   ```bash
   # 小程序
   npm run dev:mp-weixin

   # H5
   npm run dev:h5
   ```

### 5.2 后续更新

修改云函数后，只需重新右键上传对应云函数。修改前端代码后重新运行即可。

## 6. 双端请求策略

### 6.1 微信小程序

| 功能 | 调用方式 | 说明 |
|------|---------|------|
| 登录 | `uni.login` → `user-login` | 标准微信登录流程 |
| 拍照识别 | `uni.chooseImage` → `compressImage` → `imageToBase64` → `recognizeDish` | 默认直接请求百度 AI |
| 记录管理 | `food-record` 云函数 | 统一 { code, message, data } 格式 |
| 统计 | `food-record` stats action | 按周/月聚合 |

### 6.2 H5 浏览器

| 功能 | 调用方式 | 说明 |
|------|---------|------|
| 登录 | 本地生成匿名 openid | 因为 `uni.login({ provider: 'weixin' })` 在浏览器不可用；生产环境建议接入微信网页授权或短信登录 |
| 拍照识别 | `uni.chooseImage` → H5 canvas 压缩/转 Base64 → `baidu-dish` 云函数 | 避免 CORS 和密钥泄露 |
| 记录管理 | `food-record` 云函数 | 与小程序一致 |
| 统计 | `food-record` stats action | 与小程序一致 |

### 6.3 识别结果营养素估算

百度菜品识别只返回 `name/calorie/probability`，不返回三大营养素。项目已内置 `src/utils/nutrition.ts`：

- 对常见中餐菜品使用食物成分表数据。
- 对未知菜品按通用比例估算：蛋白质 15%、脂肪 30%、碳水 55%。

如需更精确，可后续扩展云端食物数据库，通过 `food-record` 的 `add` action 自动查询。

## 7. 调试与排错

### 7.1 本地查看云函数日志

- HBuilderX：云服务空间 → 云函数 → 日志/请求统计。
- 关键日志已用 `console.error` 输出失败原因。

### 7.2 常见问题

| 现象 | 可能原因 | 解决 |
|------|---------|------|
| 云函数返回 401 | 未登录或 `context.auth.OPENID` 为空 | 先调用 `user-login`；H5 会走匿名兜底 |
| H5 识别失败 | 未配置 `BAIDU_API_KEY/SECRET` 或 `baidu-dish` 未部署 | 检查云函数环境变量并重新部署 |
| 小程序识别失败 | `VITE_BAIDU_AI_API_KEY/SECRET` 为空或 IP/白名单限制 | 检查 `.env.local` 和百度 AI 控制台 |
| 保存记录后历史不刷新 | 返回结构未按 `{ code, message, data }` 处理 | 已在前端 Pinia 统一修复 |
| 历史页总热量永远显示今天 | 之前直接用了 `foodStore.todayCalories` | 已改为按选中日期计算 |

## 8. 安全与优化建议

1. **密钥管理**：微信/百度密钥仅存放在云函数环境变量，不要进 Git。
2. **图片存储**：`result.vue` 保存时已将图片上传到 uniCloud 云存储，避免临时路径过期。
3. **接口校验**：`food-record` 的 `delete` 已校验记录归属，防止越权。
4. **下一步可优化**：
   - 将营养素数据库放到云端，支持动态扩展。
   - 增加食物记录编辑功能。
   - 接入微信运动步数，计算运动消耗。
   - H5 生产环境接入微信网页授权登录，替代匿名模式。
