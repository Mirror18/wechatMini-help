# AGENTS.md

## Project Overview

WeChat mini-program for food calorie recognition via photo capture.
Stack: UniApp + Vue3 + TypeScript + Pinia.

## Initialize Project

```bash
npx degit dcloudio/uni-preset-vue#vite-ts .
npm install
```

Use `vite-ts` branch (NOT `vite` or `vite-alpha`) for TypeScript support.

## Build & Dev Commands

```bash
npm run dev:mp-weixin      # Dev mode (WeChat mini-program)
npm run build:mp-weixin    # Production build
```

Output goes to `dist/dev/mp-weixin/` and `dist/build/mp-weixin/`.

## Key Dependencies

- **Food Recognition**: 百度AI 菜品识别 API (`ai.baidu.com/tech/imagerecognition/dish`)
- **State Management**: Pinia
- **Backend**: uniCloud (cloud functions + cloud database)

## Architecture

```
src/
├── pages/          # index, result, history, stats, profile
├── components/     # CameraCapture, FoodCard, CalorieChart
├── stores/         # Pinia stores (user, food)
├── api/            # baidu-ai.ts, food-db.ts
├── types/          # food.ts, user.ts, api.ts
└── utils/          # image.ts, date.ts, storage.ts
```

## Important Notes

- Node 18+ or 20+ required
- WeChat DevTools needed for preview/debug
- Images must be Base64 encoded before sending to 百度AI API
- Use `uni.chooseImage` + `uni.compressImage` for camera/album access
