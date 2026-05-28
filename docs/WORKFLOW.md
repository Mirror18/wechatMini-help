# 开发流程规范

本文档定义了项目的完整开发流程，适用于团队协作和商业级代码管理。

---

## 一、分支策略（Git Flow）

```
main                ← 生产分支，只接受 release/hotfix 合并
├── develop         ← 开发主干，所有 feature 合并到这里
│   ├── feature/*   ← 功能分支
│   └── release/*   ← 发布分支
└── hotfix/*        ← 紧急修复分支
```

### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 主分支 | `main` | — |
| 开发分支 | `develop` | — |
| 功能分支 | `feature/<简要描述>` | `feature/calorie-chart` |
| 发布分支 | `release/v<版本号>` | `release/v1.2.0` |
| 热修复 | `hotfix/v<版本号>-<描述>` | `hotfix/v1.0.2-fix-login` |

### 分支用途说明

- **main**: 始终保持可发布状态。每次合并到 main 都应该打 tag 并触发部署。
- **develop**: 日常开发的集成分支。所有 feature 分支最终合并到这里。
- **feature/\***: 从 develop 拉出，完成后合并回 develop。生命周期短，一个分支只做一件事。
- **release/\***: 从 develop 拉出，用于发布前的测试和修复。测试通过后合并到 main + develop。
- **hotfix/\***: 从 main 拉出，用于紧急修复线上问题。修复后合并到 main + develop。

---

## 二、日常工作流程

### 2.1 开始新功能

```bash
# 1. 确保 develop 是最新的
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/calorie-chart

# 3. 开发、提交（遵循提交规范）
git add .
git commit -m "feat(chart): 添加热量趋势图表"

# 4. 推送到远程
git push origin feature/calorie-chart

# 5. 在 GitHub 创建 PR: feature/calorie-chart → develop
```

### 2.2 代码审查与合并

1. PR 创建后，CI 自动运行代码质量检查
2. 至少 1 位团队成员审查通过
3. 合并策略：**Squash and Merge**（将多个 commit 压缩为一个，保持 develop 历史整洁）
4. 合并后删除功能分支

### 2.3 发布新版本

```bash
# 1. 从 develop 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 在发布分支上做最后的修复（如果有）
git commit -m "fix: 修复xxx问题"

# 3. 合并到 main
git checkout main
git merge --no-ff release/v1.2.0

# 4. 打版本 tag（自动更新 CHANGELOG + bump version）
npm run release:minor   # 或 patch/major

# 5. 推送 main + tag（触发自动部署）
git push origin main --follow-tags

# 6. 合并回 develop
git checkout develop
git merge --no-ff release/v1.2.0
git push origin develop

# 7. 删除发布分支
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
```

### 2.4 紧急修复（Hotfix）

```bash
# 1. 从 main 创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/v1.0.2-fix-login

# 2. 修复并提交
git commit -m "fix: 修复登录接口超时问题"

# 3. 合并到 main
git checkout main
git merge --no-ff hotfix/v1.0.2-fix-login

# 4. 打 patch 版本
npm run release:patch

# 5. 推送
git push origin main --follow-tags

# 6. 合并回 develop
git checkout develop
git merge --no-ff hotfix/v1.0.2-fix-login
git push origin develop

# 7. 删除热修复分支
git branch -d hotfix/v1.0.2-fix-login
```

---

## 三、提交规范（Conventional Commits）

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(chart): 添加热量趋势图表` |
| `fix` | Bug 修复 | `fix: 修复登录接口超时` |
| `docs` | 文档 | `docs: 更新 API 文档` |
| `style` | 代码格式（不影响逻辑） | `style: 格式化代码` |
| `refactor` | 重构（不新增功能/不修复 Bug） | `refactor: 重构图片压缩逻辑` |
| `perf` | 性能优化 | `perf: 优化图片加载速度` |
| `test` | 测试 | `test: 添加食物识别单元测试` |
| `chore` | 构建/工具/依赖 | `chore: 升级 vue 到 3.5` |
| `ci` | CI 配置 | `ci: 添加 H5 构建流水线` |
| `build` | 构建系统 | `build: 配置 vite 别名` |

### Scope（可选）

用于说明影响范围，例如：`chart`、`login`、`api`、`store`、`ui`

### 提交信息示例

```
feat(recognition): 支持批量图片识别

- 用户可一次选择多张图片
- 识别结果以列表形式展示
- 单次最多支持 5 张图片

Closes #42
```

> 提交信息由 commitlint 强制校验（pre-commit hook），不符合规范的提交会被拒绝。

---

## 四、版本管理

### 语义化版本（Semantic Versioning）

```
v<MAJOR>.<MINOR>.<PATCH>
```

| 版本位 | 何时递增 | 示例 |
|--------|---------|------|
| MAJOR | 不兼容的 API 变更 | v1.0.0 → v2.0.0 |
| MINOR | 向后兼容的功能新增 | v1.0.0 → v1.1.0 |
| PATCH | 向后兼容的 Bug 修复 | v1.0.0 → v1.0.1 |

### 自动版本命令

```bash
npm run release          # 根据 commit 历史自动判断版本号
npm run release:patch    # 强制 patch +1
npm run release:minor    # 强制 minor +1
npm run release:major    # 强制 major +1
```

这些命令会自动：
1. 根据 conventional commits 计算新版本号
2. 更新 `package.json` 中的 version
3. 生成/更新 `CHANGELOG.md`
4. 创建 git commit
5. 创建 git tag（格式：`v1.2.0`）

---

## 五、CI/CD 流水线

### 5.1 代码质量检查（ci.yml）

**触发条件**：push 或 PR 到 `main` / `develop`

检查项（按顺序）：
1. `npm ci` — 安装依赖
2. `npm run lint:check` — ESLint 检查
3. `npm run format:check` — Prettier 检查
4. `npm run type-check` — TypeScript 类型检查
5. `npm run test` — 单元测试

### 5.2 构建验证（build.yml）

**触发条件**：push 或 PR 到 `main` / `develop`

- 矩阵构建 mp-weixin 和 h5 两个目标
- 构建产物保留 7 天

### 5.3 自动部署（deploy-wechat.yml）

**触发条件**：推送 `v*` tag 或手动触发

流程：
1. 构建微信小程序
2. 从 CHANGELOG.md 提取当前版本的变更说明
3. 使用 miniprogram-ci 上传到微信
4. 创建 GitHub Release（附带变更说明）

---

## 六、分支保护规则

### main 分支

| 规则 | 配置 |
|------|------|
| 要求 PR 才能合并 | ✅ 开启 |
| 要求审查人数 | 1 人 |
| 要求状态检查通过 | ✅ `quality` + `build` |
| 要求分支保持最新 | ✅ 开启 |
| 包括管理员 | ✅ 开启 |

### develop 分支

| 规则 | 配置 |
|------|------|
| 要求状态检查通过 | ✅ `quality` |
| 允许直接推送 | ✅ 开启（开发阶段灵活性） |

### 手动配置步骤（GitHub 网页端）

1. 进入仓库 → **Settings** → **Branches**
2. 点击 **Add rule**
3. Branch name pattern 输入 `main`
4. 勾选以下选项：
   - ✅ Require a pull request before merging
   - ✅ Require approvals（设置为 1）
   - ✅ Require status checks to pass before merging
     - 搜索并添加 `quality` 和 `build`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
5. 点击 **Create** 保存

对 `develop` 重复以上步骤，但：
- 不勾选 "Require a pull request"
- 只添加 `quality` 状态检查

---

## 七、目录结构与文件说明

```
.github/
├── workflows/
│   ├── ci.yml                  # 代码质量检查
│   ├── build.yml               # 构建验证
│   └── deploy-wechat.yml       # 微信小程序部署
├── pull_request_template.md    # PR 模板
└── ISSUE_TEMPLATE/
    ├── bug_report.md           # Bug 报告模板
    └── feature_request.md      # 功能请求模板

.husky/
├── pre-commit                  # lint-staged（ESLint + Prettier）
└── commit-msg                  # commitlint（提交信息校验）

docs/
└── WORKFLOW.md                 # 本文档

.versionrc.json                 # standard-version 配置
CHANGELOG.md                    # 自动生成的变更日志
commitlint.config.js            # commitlint 配置
.prettierrc                     # Prettier 配置
.eslintrc.cjs                   # ESLint 配置
```

---

## 八、常见问题

### Q: 我的 commit 被 commitlint 拒绝了怎么办？

检查你的提交信息是否符合格式：`<type>(<scope>): <subject>`。常见错误：
- type 不在允许列表中
- subject 首字母大写了（应该小写）
- 缺少冒号后的空格

### Q: 如何查看当前版本？

```bash
node -p "require('./package.json').version"
```

### Q: 如何回退一个已发布的版本？

```bash
# 1. 创建 revert commit
git revert <commit-hash>

# 2. 作为 hotfix 处理
npm run release:patch
git push origin main --follow-tags
```

### Q: feature 分支应该从哪里拉出？

始终从 `develop` 拉出，不要从 `main` 拉出。

### Q: 多个 feature 并行开发时有冲突怎么办？

在合并前，先将 develop 最新代码合并到你的 feature 分支：

```bash
git checkout feature/my-feature
git merge develop
# 解决冲突后
git commit -m "merge: 同步 develop 最新代码"
```
