# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

This is a documentation-first repo with a single Expo app:

- `docs/` — product source of truth. Start here for any feature work.
  - `PRD.md` — product requirements. **§十一 (v0.4) overrides §一–§十** where they conflict.
  - `design-system.md` — full token spec; canonical names live here.
  - `dev-log.md` — chronological decisions, environment gotchas, and the LLM/Gemini integration history. Read recent entries before touching push notifications, mascot LLM, or onboarding flows.
  - `business-model.md`, `tech-research.md`, `components.md`, `v0.4-test-plan.md`.
- `app/` — the Expo / React Native app. All code work happens here.

## Commands (run from `app/`)

```bash
npm install
npm run start         # expo start (Metro)
npm run ios           # expo run:ios — required for real notifications/camera; Expo Go is avoided (see dev-log)
npm run android
npm run web
npm run lint          # expo lint (eslint-config-expo flat config)
npm run typecheck     # tsc --noEmit
```

No test runner is configured.

## Environment variables

Copy `app/.env.example` → `app/.env.local` (gitignored). Only `EXPO_PUBLIC_*` vars reach the bundle.

- `EXPO_PUBLIC_GEMINI_KEY` — Gemini 2.5 Flash Lite key for `src/services/mascotLlm.ts`. Empty key → fallback to `src/data/dialogues.ts` mock pool.
- `EXPO_PUBLIC_LLM_ENABLED` — must be the literal string `"true"` to enable LLM. Default off (mock pool).
- `EXPO_PUBLIC_DETECT_API_BASE` — base URL of the food detection backend (`POST /detect`, multipart `image`). Defaults to a hard-coded LAN IP in `src/services/foodDetection.ts`.

The Gemini key is bundle-visible — fine for closed beta, must move behind a Cloudflare Worker before launch (`docs/dev-log.md`).

## Secrets / 凭证管理

mealmate 用到的 token / API key 持久化位置。任何 session 启动后 shell 已 source `~/.zshrc`，所以 `EXPO_TOKEN` 等环境变量自动可用，不要每次问 xin。

| 凭证 | 位置 | 用途 | 失效后怎么再生 |
|---|---|---|---|
| `EXPO_TOKEN` | `~/.zshrc`（`export EXPO_TOKEN=...`） | EAS Build / Submit 命令调 expo.dev API | https://expo.dev/settings/access-tokens |
| `EXPO_PUBLIC_GEMINI_KEY` | `app/.env.local` + EAS Build env(production profile) | Gemini Vision OCR + mascot LLM | https://aistudio.google.com/apikey |
| Apple Developer 凭证 | macOS Keychain（Xcode 管理） | iOS code sign / provisioning profile | Xcode → Settings → Accounts |
| ASC API Key | `~/.appstoreconnect/private_keys/AuthKey_*.p8` | `eas submit` 上 TestFlight | https://appstoreconnect.apple.com/access/api |

**规则：**
- 这些**不能写到 git**（`.gitignore` 已覆盖 `.env.local`；`~/.zshrc` 不在 repo 里；keychain / .p8 都在用户家目录外的安全位置）。
- session 启动就读 `~/.zshrc` 自动有 `EXPO_TOKEN`，不要再问 xin。
- token revoke / 失效 → xin 在表格里的 URL 重新生 + 覆盖 `~/.zshrc` 那行。

## Bundle ID / 双环境

prod (`com.xinray.mealmate`) vs dev (`com.xinray.mealmate.dev`) — Debug/Release config 在 pbxproj 里硬切，并存不撞。完整说明 + 已知 fragility（`ios/` gitignore）见仓库根 [`README.md`](./README.md) "Bundle ID / 双环境约定" 段。

## 本地 dev build / iOS 装机

dev variant（`com.xinray.mealmate.dev`，跟 TestFlight 的 prod bundle 不撞，主屏并存）：

```bash
cd /Users/xiangxin/Documents/mealmate/app
APP_VARIANT=dev npx expo run:ios --device       # 真机
APP_VARIANT=dev npx expo run:ios                # simulator
```

prod variant（**会覆盖** TestFlight install，只用在严格模拟 prod 行为时）：

```bash
cd /Users/xiangxin/Documents/mealmate/app
npx expo run:ios --device                       # 无 APP_VARIANT prefix
```

**Claude 可直接执行（不需要每次问 xin）**，前提：
- iPhone 数据线连着 + 解锁
- iPhone 跟 Mac 同一个 WiFi / 个人热点开着（Metro 走 LAN）
- 第一次新 bundle ID 装机要 Xcode 自动 register profile（走 `mealmate.xcworkspace` → Signing → Try Again，xin 一次性操作）

build 一次约 2-5 分钟（增量）/ 8-15 分钟（clean）。

## Architecture

### Routing (expo-router, typed routes on)

`app/app/` uses three groups:

- `app/index.tsx` — redirect entry. Routes to `/onboarding/eating` if `!onboardingDone`, else `/(main)/home`. Waits for Zustand persist hydration.
- `app/onboarding/` — first-run flow: `name → schedule → eating`. (PRD §11.J: the old ChatGPT/API-key step is removed; LLM is search-and-replace via `.env.local`.)
- `app/(main)/` — 4-tab bottom navigator (PRD §11.A): `home`, `records`, `stats`, `settings` (labeled "我的"). Tab icons live in `app/assets/tab-icons/` as `<name>-on.png` / `<name>-off.png`.
- `app/(modal)/` — modal-presented routes outside the tab bar: `photo`, `meal-reminder`, `meal-missed`, `weight-entry`.

Root `_layout.tsx` is the heartbeat. On mount and on every `AppState` → `active` it:
1. `rollDayIfNeeded()` archives yesterday's `todayMeals` into `mealHistory`.
2. Re-schedules three `DAILY` local notifications (one per meal slot, body picked by current HP band).
3. Runs `runMissedScan()` — any pending slot past its 90-min window auto-flips to `missed`, deducts HP, and pushes two dialogue records. If new misses are found, pushes the `meal-missed` modal.
4. Listens for notification taps and pushes `(modal)/photo?slot=...`.

### State (Zustand + AsyncStorage)

`src/store/useStore.ts` is the single store; persisted under key `mealmate-store` with `version: 5`. Selectors live in `src/store/selectors/`. Key invariants:

- **HP scale is 0–100** (`HP_MAX = 100`). The persist migration `v1 → v2` upscales legacy 0–15 values by `100/15`. Never reintroduce the old scale.
- HP deltas are constants — `HP_MEAL_PHOTO_GAIN = 5`, `HP_MEAL_MISSED_LOSS = 10`. `gentleMode` halves the loss only.
- HP reaching 100 triggers `Stage 1 → Stage 2` exactly once (no Stage 3+ logic yet; PRD §四 stages 3–5 are still spec-only).
- `todayMeals[slot]` is a 3-state machine: `pending | done | missed`. Both `markMealDone` and `markMealMissed` are idempotent per slot/day and append to `mealRecords`.
- History caps: `mealHistory` keeps 30 days, `weightHistory` 90 days, `fullnessHistory` 270 entries (90d × 3 meals), `dialogueHistory` 50 entries (newest first).
- `__dev_*` actions are unguarded — only call from `__DEV__`-gated UI (the settings developer panel).

When changing the persisted shape, bump `version` and add a migration branch; the current migrate function is the template (`useStore.ts:308`).

### HP bands (single source of truth)

`src/theme/hp.ts` owns the HP → band mapping. The 4-band table (`full 80–100 / stable 50–79 / low 20–49 / critical 0–19`) drives:

- Status title / subtitle / hint copy on the home screen.
- Which mascot PNG to render (per-band assets under `app/assets/mascot/`).
- Mascot aspect ratio (`mascotAspect` per band; `critical` is intentionally not 524/461).

`getHpBand(hp, stage)` is the only legal way to resolve copy + asset. Pass `stage=1` to swap to the gentler Stage 1 copy table (uses `full.png` as a fallback mascot until per-band Stage 1 art lands). `HP_LOW_THRESHOLD = 30` is a separate, broader threshold reserved for missed-check / reminder gating — not for visuals.

### Design tokens

Two parallel definitions exist intentionally:

- `app/tailwind.config.js` — NativeWind class names (`bg-bg`, `text-ink`, …). Used wherever `className` works.
- `app/src/theme/tokens.ts` — TypeScript constants. Used by Animated values, SVG fills, inline styles where className doesn't reach.

Keep both in sync manually until v0.5 consolidates them (`tokens.ts` header note). The richer Figma-derived palette in `docs/design-system.md` is the long-term target; tokens.ts is the v0.4 subset currently wired up.

### Services

- `src/services/notifications.ts` — wraps `expo-notifications`. Re-schedules all 3 dailies whenever schedules or HP change (body text is frozen at schedule time, so reschedule = refresh copy).
- `src/services/missedScan.ts` — pure detector + side-effectful runner. iOS background JS is unreliable, so detection runs on foreground transitions only. Dedup is in the store action, not here.
- `src/services/mascotLlm.ts` — Gemini 2.5 Flash Lite client. Returns `null` on disabled/no-key/error; callers must fall back to `src/data/dialogues.ts`. The system prompt enforces PRD §八 safety rules — do not weaken (no "消失/不见/离开/死亡" framing).
- `src/services/foodDetection.ts` — calls a separate backend's `POST /detect`. Failures must surface, not silently allow — `(modal)/photo` decides whether to degrade gracefully.
- `src/services/imagePicker.ts` — camera + library wrapper for the photo flow.

### Feed composition

The records tab feed is built by `src/data/feed.ts`'s `buildTodayFeed` from three sources: `todayMeals + schedules` (meal events), `fullnessHistory` (rating events), `dialogueHistory` (mascot lines). Render order is reverse-chronological. Stats charts are computed in `src/store/selectors/stats.ts` and rendered by `src/components/ui/TrendChart.tsx` (react-native-svg).

## Conventions

- Path alias `@src/*` → `app/src/*` (see `tsconfig.json`). Always prefer the alias over relative `../../..` paths.
- Strict TypeScript is on; React Compiler and typed routes are enabled in `app.json`. Treat route strings as typed — `as never` casts in the codebase are workarounds, not encouragement.
- Background color across screens is `#FFF8F1` (warm cream). The "状态不好" page no longer exists as a route — the `critical` HP band renders inline on Home (PRD §11.G).
- LLM and food-recognition features are search-and-replace optional. Any new code path that depends on them must degrade cleanly when disabled.
- Reset script for local dev: `npm run reset-project` (wipes `app/app/` back to a scaffold — destructive).

## Safety rails baked into the product

PRD §八 is enforced in code:

- All mascot copy (mock pool and LLM prompt) avoids loss-framed threats.
- `gentleMode` halves negative HP deltas and is the path to soften further wording later.
- Settings provides "pause all reminders" and "data export/delete" entry points — keep these reachable when restructuring the settings screen.
