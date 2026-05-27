# AGENTS.md

## What This Is

WeChat mini-program for food calorie recognition via photo capture.
Stack: UniApp (Vue3 + Vite + TypeScript) + Pinia + uniCloud (Aliyun).

## Commands

```bash
npm run dev:mp-weixin      # Dev server (WeChat mini-program target)
npm run dev:h5             # Dev server (H5/browser target)
npm run build:mp-weixin    # Production build (WeChat)
npm run build:h5           # Production build (H5)
npm run type-check         # vue-tsc --noEmit
npm run lint               # ESLint with auto-fix
npm run lint:check         # ESLint check only
npm run format             # Prettier with auto-fix
npm run format:check       # Prettier check only
npm run test               # Run tests (vitest)
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

Output: `dist/dev/mp-weixin/` and `dist/build/mp-weixin/`.

## Path Alias

`@/*` → `./src/*` (configured in tsconfig.json).

## Environment Variables

Vite env vars require `VITE_` prefix. Copy `.env.example` to `.env.local`:
- `VITE_BAIDU_AI_API_KEY` / `VITE_BAIDU_AI_SECRET_KEY` — 百度AI dish recognition
- `UNICLOUD_SPACE_ID` / `UNICLOUD_SPACE_PROVIDER` — uniCloud config (not Vite-prefixed, used by uniCloud CLI)

Access in code: `import.meta.env.VITE_*` (see `src/config/index.ts`).

## Architecture

```
src/
├── pages/          # 5 pages: index, result, history, stats, profile
├── components/     # Empty — components are inline in pages
├── stores/         # Pinia: user.ts, food.ts (barrel: stores/index.ts)
├── api/            # baidu-ai.ts — Baidu dish recognition API client
├── config/         # index.ts — app config, reads env vars
├── types/          # food.ts, user.ts, api.ts (barrel: types/index.ts)
├── utils/          # image.ts (chooseImage, compressImage), date.ts
└── __tests__/      # Test files (Vitest)

uniCloud-aliyun/cloudfunctions/   # Backend (plain JS, NOT TypeScript)
├── food-record/    # CRUD + stats for food records
├── user-login/     # WeChat login via jscode2session
└── user-profile/   # User profile management
```

## UniApp Quirks

- Uses `uni.*` APIs instead of browser APIs (e.g., `uni.request`, `uni.chooseImage`)
- Page routing is declarative via `src/pages.json`, not a router library
- TabBar config is in `pages.json` — 4 tabs: 识别, 记录, 统计, 我的
- App lifecycle: `onLaunch`/`onShow`/`onHide` from `@dcloudio/uni-app` (see `App.vue`)
- `manifest.json` holds mini-program appid and platform permissions
- Images must be Base64-encoded before sending to Baidu API (see `api/baidu-ai.ts:50`)

## Cloud Functions

Plain JS under `uniCloud-aliyun/cloudfunctions/`. No TypeScript.
- `food-record`: actions: `add`, `list`, `delete`, `stats` — uses `context.auth.OPENID` for user identity
- `user-login`: exchanges WeChat `js_code` for openid, requires `WX_APPID` and `WX_SECRET` env vars
- Cloud DB collections: `food_records`, `users`

## Key Dependencies

- `@dcloudio/*` v3.0.0-4080420251103001 — UniApp SDK (pinned exact version)
- `pinia` ^3.0.4
- `vue` ^3.4.21
- `vue-i18n` ^9.1.9 (declared but not wired up in main.ts)

## Code Quality Tools

- **ESLint**: `@vue/eslint-config-typescript` + `@vue/eslint-config-prettier`
- **Prettier**: Semi: false, singleQuote: true, trailingComma: all
- **Husky**: Pre-commit runs `lint-staged`, commit-msg runs `commitlint`
- **commitlint**: Conventional commits (feat, fix, docs, style, refactor, test, chore, perf, ci, build)
- **Vitest**: Unit testing framework with happy-dom environment

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml`: Code quality checks (lint, format, type-check, test)
- `build.yml`: Build verification for mp-weixin and h5
- `deploy-wechat.yml`: Auto-deploy to WeChat on tag push (requires WX_APPID, WX_UPLOAD_KEY secrets)

## Deployment

### WeChat Mini Program
1. Push a tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Or manually trigger workflow with version number

### uniCloud Cloud Functions
Deploy via HBuilderX (right-click cloud function → Upload and Deploy)
No CLI deployment available for uniCloud.
