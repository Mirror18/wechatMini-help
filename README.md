# 食物热量识别小程序

一款基于 UniApp + Vue3 + TypeScript 开发的微信小程序，通过拍照识别食物并计算热量。

## 功能特性

- 📸 拍照识别食物（基于百度AI菜品识别）
- 🔍 食物热量和营养成分查询
- 📊 每日/每周热量统计图表
- 📝 饮食历史记录
- 👤 个人中心与目标设定

## 技术栈

| 类型 | 技术 |
|------|------|
| 框架 | UniApp + Vue3 + TypeScript |
| 状态管理 | Pinia |
| 食物识别 | 百度AI菜品识别API |
| 后端服务 | uniCloud |
| 平台 | 微信小程序 |

## 快速开始

### 环境要求

- Node.js 18+ 或 20+
- 微信开发者工具
- 百度AI开放平台账号（用于菜品识别API）

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd wechat-help

# 安装依赖
npm install
```

### 开发

```bash
# 微信小程序开发模式
npm run dev:mp-weixin
```

### 构建

```bash
# 生产环境构建
npm run build:mp-weixin
```

## 项目结构

```
src/
├── pages/              # 页面
│   ├── index/         # 首页（拍照入口）
│   ├── result/        # 识别结果页
│   ├── history/       # 历史记录页
│   ├── stats/         # 统计分析页
│   └── profile/       # 个人中心页
├── components/         # 公共组件
├── stores/             # Pinia状态管理
├── api/                # API接口封装
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
└── static/             # 静态资源
```

## 文档

- [API接口文档](docs/api.md)
- [架构说明](docs/architecture.md)
- [开发指南](docs/development.md)

## 开发计划

- [x] 项目初始化
- [ ] 页面开发
- [ ] API集成
- [ ] 测试优化
- [ ] 发布上线

## 许可证

MIT
<!-- protection test -->
