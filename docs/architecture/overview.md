# Architecture Overview

## 当前 v0.4 — 纯客户端

```
┌──────────────────────────────────────────────────────────┐
│                      iPhone (iOS app)                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │            React Native + Expo SDK 54              │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Expo Router 6 (file-based)                  │  │  │
│  │  │   - index.tsx → 根据 onboardingDone 路由     │  │  │
│  │  │   - (main) tab group: home/records/stats/my  │  │  │
│  │  │   - (modal) group: photo/weight-entry/...    │  │  │
│  │  │   - onboarding/ 3 屏                         │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐   │  │
│  │  │  Zustand   │  │ NativeWind │  │  Reanimated │   │  │
│  │  │  + persist │  │   v4       │  │     v4      │   │  │
│  │  └─────┬──────┘  └────────────┘  └─────────────┘   │  │
│  │        │                                            │  │
│  │  ┌─────▼──────────────────────────────────────┐    │  │
│  │  │  AsyncStorage (RCTAsyncLocalStorage_V1)    │    │  │
│  │  │   key: "mealmate-store"  version: 7        │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                     │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐     │  │
│  │  │ expo-notifications│  │ expo-image-picker  │     │  │
│  │  │ 三餐本地推送      │  │ 拍照 / 相册        │     │  │
│  │  └─────────────────┘  └──────────────────────┘     │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  ⚠️ Mascot LLM — v0.4 临时禁用              │   │  │
│  │  │     原方案：直连 Gemini（key 暴露问题）     │   │  │
│  │  │     v0.5+ 走 Cloudflare Worker 代理（ADR-004）│   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

外部依赖：无（纯客户端）
```

## 关键技术决策

详见 [`docs/architecture/decisions/`](./decisions/) ADR 文件夹。

- **ADR-001**：选 Expo（vs bare RN）
- **ADR-002**：HP 0-100 + 4 band（vs 0-15 + 5 band）
- **ADR-003**：zustand（vs redux / jotai）
- **ADR-004**：LLM key 暴露 → 临时禁用 + v0.5 Worker 代理

## v0.5+ 预案 — 加后端

```
┌────────────────────┐      JWT Bearer       ┌─────────────────────────┐
│     iPhone app     │ ◄───────────────────► │   Cloudflare Worker     │
│  (同上 v0.4 客户端) │                       │   api.mealmate.app/v1   │
│                    │                       │                          │
│   + expo-secure-   │                       │   Routes:                │
│     store (JWT)    │                       │    /llm/generate         │
│   + apple-auth     │                       │    /vision/classify      │
│   + 增量 sync       │                       │    /sync/{meal,weight}   │
│                    │                       │    /auth/apple           │
└────────────────────┘                       └────────────┬────────────┘
                                                          │
                            ┌─────────────────────────────┼─────────────────────┐
                            │                             │                     │
                       ┌────▼────┐               ┌────────▼──────┐      ┌─────▼──────┐
                       │ CF D1   │               │  Gemini API   │      │  Apple JWKS │
                       │ Database│               │  / Claude API │      │             │
                       │ (User/  │               │  (LLM upstream)│     │             │
                       │  Meal/  │               └────────────────┘     └─────────────┘
                       │ Weight) │
                       └─────────┘
```

详细数据库 schema 见 [`docs/architecture/database.md`](./database.md)。
认证流程见 [`docs/api/auth.md`](../api/auth.md)。

## 模块清单

详细组件 props / 用在哪 / Figma 引用 → [`docs/architecture/modules.md`](./modules.md)。

按职责分：

| 层 | 位置 | 主要文件 |
|---|---|---|
| **路由** | `app/app/` | `_layout.tsx` / `(main)/` / `(modal)/` / `onboarding/` |
| **业务组件** | `app/src/components/home/` | `HomeStage1.tsx` / `HomeStage2.tsx` / `HomeMealStatusSlot.tsx` / `HomeRecordsSection.tsx` |
| **UI 组件** | `app/src/components/ui/` | `Card` / `PrimaryButton` / `HpHeartsContent` / `MealReminderCard` / `TrendChart` 等 |
| **阶段过渡屏**（feature/stage-transitions）| `app/src/components/stage/` | `StageStartScreen.tsx` / `StageEndScreen.tsx` |
| **状态** | `app/src/store/` | `useStore.ts` / `selectors/{reminder,stats}.ts` |
| **数据** | `app/src/data/` | `dialogues.ts` / `feed.ts` / `stageTransitions.ts` / `types.ts` |
| **副作用** | `app/src/services/` | `notifications.ts` / `missedScan.ts` / `mascotLlm.ts` / `imagePicker.ts` |
| **主题** | `app/src/theme/` | `tokens.ts` / `hp.ts` |

## 渲染流

```
RootLayout (_layout.tsx)
  ├─ rollDayIfNeeded（按日重置 today 数据）
  ├─ scheduleMealReminders（onboardingDone 后按 schedule push 三条本地通知）
  ├─ runMissedScan（启动 / 前台激活时跑，检测错过餐 → 自动 markMealMissed + 弹 modal）
  └─ <Stack>
       ├─ index → Redirect to onboarding 或 (main)/home
       ├─ onboarding/ → 3 步
       └─ (main)/_layout.tsx (Tabs)
            ├─ stage 过渡触发（feature/stage-transitions）
            └─ home / records / stats / settings
            └─ (modal) 弹出 photo / weight-entry / meal-reminder / meal-missed / stage-*-{start,end}
```

## 限制

- **iOS only**（package.json 已删 android 配置；Expo 允许跑 web 但 v0.4 未对 RNW 适配）
- **单设备**（无跨端同步，AsyncStorage 是设备本地的）
- **无登录态**（resetAll = 删本地数据）
- **无 crash 上报 / 监控**（v0.5+ 加 Sentry）
