# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
npm run dev:mp-weixin     # WeChat mini program dev (output: dist/dev/mp-weixin/)
npm run dev:h5            # H5 browser dev (Vite dev server)

# Build
npm run build:mp-weixin   # WeChat production build
npm run build:h5          # H5 production build

# Code quality
npm run lint              # ESLint auto-fix
npm run lint:check        # ESLint check only
npm run format            # Prettier auto-fix
npm run format:check      # Prettier check only
npm run type-check        # vue-tsc --noEmit

# Test
npm run test              # Vitest run
npm run test:watch        # Vitest watch mode
npm run test:coverage     # Vitest with coverage

# Cloud functions (deploy via uniCloud admin panel, not CLI)
```

## Architecture

**Stack:** UniApp 3.0 + Vue 3.4 + TypeScript + Pinia (frontend), uniCloud Aliyun serverless (backend)

### Frontend (src/)

- **Pages:** 4 tab pages (index/识别, history/记录, stats/统计, profile/我的) + 1 non-tab page (result/识别结果). Routes defined in `src/pages.json`.
- **State (Pinia):** `src/stores/food.ts` — food records CRUD + stats; `src/stores/user.ts` — WeChat login + profile. Cloud function calls happen inside store actions.
- **API:** `src/api/baidu-ai.ts` — Baidu AI dish recognition with OAuth token caching.
- **Utils:** `src/utils/image.ts` (chooseImage, compressImage), `src/utils/date.ts` (formatDate, getToday, getWeekRange, getMonthRange).
- **Config:** `src/config/index.ts` reads `VITE_BAIDU_AI_API_KEY` and `VITE_BAIDU_AI_SECRET_KEY` from env.
- **Types:** `src/types/` — food, user, and API response interfaces.

### Backend (uniCloud-aliyun/cloudfunctions/)

Three plain-JS cloud functions:
- **user-login** — jscode2session, auto-creates user doc in `users` collection
- **user-profile** — get/update user profile (nickname, avatar, dailyCalorieGoal)
- **food-record** — add/list/delete food records + stats aggregation by date range

All cloud functions use `context.auth.OPENID` for userId. No auth middleware — relies on uniCloud's built-in WeChat identity.

### Data Collections (implied by cloud function code)
- `users`: openid, nickname, avatar, dailyCalorieGoal, timestamps
- `food_records`: userId, foodName, calories, protein, fat, carbs, imageUrl, confidence, mealType, date, createdAt

### Key Data Flow
```
camera → chooseImage → compressImage → imageToBase64 → Baidu AI recognizeDish
→ user selects candidate + mealType → food-store.addRecord → cloud function → DB
```

### Notable
- No components in `src/components/` yet — UI is inline in page `.vue` files
- vue-i18n is declared but not wired up
- appid in `manifest.json` is empty (must be set before WeChat deploy)
- Tests are placeholder-only (one file asserting `true === true`)
- Environment keys: Baidu AI (API key + secret key) via `VITE_` prefix; WeChat appid + secret via uniCloud env vars
