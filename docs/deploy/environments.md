# Environments

## 当前

| env | 用途 | 配置 |
|---|---|---|
| **dev** | 本地开发 | Metro `npx expo start --dev-client` + simulator / 真机 dev build |

只有 dev。没有 staging / prod 后端因为 v0.4 客户端 only。

## v0.5+ 预案

| env | 客户端 build | 后端 | 数据库 |
|---|---|---|---|
| **dev** | `expo run:ios --device`（debug） | localhost Worker（`wrangler dev`） | local SQLite |
| **staging** | EAS Build profile=`preview` → TestFlight internal | `staging-api.mealmate.app`（CF Worker staging）| CF D1 / Hyperdrive staging |
| **prod** | EAS Build profile=`production` → App Store | `api.mealmate.app`（CF Worker prod） | CF D1 / Hyperdrive prod |

## 配置约定

- 客户端 `EXPO_PUBLIC_API_BASE` 切 dev / staging / prod 三档（`.env.local` 不进 git）。
- secrets（Worker 用的 Gemini key 等）只在 `wrangler secret put` 设置，绝不进 repo。
- Apple Sign In 用同一个 Bundle ID（`com.xinray.mealmate`）三 env 共享。
