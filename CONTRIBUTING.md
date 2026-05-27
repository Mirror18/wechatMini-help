# 贡献指南

## 开发流程

1. Fork 并克隆仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交代码：`git commit -m "feat: add your feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具
- `perf:` 性能优化
- `ci:` CI/CD 相关
- `build:` 构建系统

## 代码规范

- 运行 `npm run lint` 检查代码
- 运行 `npm run format` 格式化代码
- 运行 `npm run type-check` 检查类型
- 运行 `npm run test` 运行测试

## 分支策略

- `main` - 生产分支，受保护
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `release/*` - 发布分支

## 开发环境

### 环境要求

- Node.js 18+ 或 20+
- 微信开发者工具
- 百度 AI 账号（用于菜品识别）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev:mp-weixin
```

编译完成后，在微信开发者工具中导入 `dist/dev/mp-weixin` 目录。

### 运行测试

```bash
npm run test
```

### 代码检查

```bash
npm run lint:check
npm run format:check
npm run type-check
```

## 部署

### 微信小程序

1. 推送标签触发自动部署：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. 或手动触发 GitHub Actions workflow

### uniCloud 云函数

使用 HBuilderX 右键上传部署（不支持 CLI 部署）。

## 问题反馈

- 提交 Issue 时请包含详细的复现步骤
- 提交 PR 时请确保通过所有检查
