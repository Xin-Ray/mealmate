# Environments

## v1.0 现状（2026-05-18）

| env | 用途 | 客户端 | 后端 | 数据库 |
|---|---|---|---|---|
| **dev** | 本地开发 | Metro `expo start --dev-client` + simulator / 真机 dev build | 直连 Gemini API（key 在 `.env.local`）+ self-host YOLO `http://192.168.1.157:8000` | AsyncStorage（mealmate-store 持久化 v9）|
| **staging** | 未启用 | — | — | — |
| **prod** | EAS Build + TestFlight + App Store | EAS Build `production` profile → App Store | 同 dev（v1.0 客户端 only）| AsyncStorage |

v1.0 是 **客户端 only**：
- LLM 文案直连 Gemini Flash Lite（mascotLlm.ts）
- Vision OCR 直连 Gemini 2.5 Flash（weightOcr.ts）
- 食物识别走 self-host YOLO（foodDetection.ts，默认 `192.168.1.157:8000` 可配 `EXPO_PUBLIC_DETECT_API_BASE`）
- 三个都 fail-soft：服务挂时核心打卡 / +HP / 文案池 fallback 不受影响

## 配置 / 密钥（v1.0）

### 客户端 `.env.local`（**不进 git**，`.gitignore` 已排除）

```
EXPO_PUBLIC_GEMINI_KEY=<xin Gemini API key>
EXPO_PUBLIC_LLM_ENABLED=true
EXPO_PUBLIC_DETECT_API_BASE=http://192.168.1.157:8000  # YOLO 后端，可选，默认硬编码
```

⚠️ `EXPO_PUBLIC_*` 前缀的环境变量会 **被打进客户端 bundle**，反编译 ipa 可拿到。**v1.1 必须切到代理**（见下方"v1.1+ 预案"）。

### EAS Build credentials（首次 `eas build` 时配）

- Apple Developer 账号：xin 的 Apple ID
- distribution certificate：EAS 自动生成 + 上传
- provisioning profile：EAS 自动生成
- 都存在 EAS 服务端，不进 repo

### 监控

未配置（v1.0 没有 crash 上报）。Sentry / Bugsnag 是 v1.1 计划。

## v1.1+ 预案 — 加后端

| env | 客户端 build | 后端 | 数据库 |
|---|---|---|---|
| **dev** | `expo run:ios --device`（debug）| localhost Worker（`wrangler dev`）| local SQLite |
| **staging** | EAS Build `preview` → TestFlight internal | `staging-api.mealmate.app`（CF Worker staging）| CF D1 staging |
| **prod** | EAS Build `production` → App Store | `api.mealmate.app`（CF Worker prod）| CF D1 prod |

### v1.1+ 配置约定

- 客户端加 `EXPO_PUBLIC_API_BASE`，切 dev / staging / prod 三档（`.env.local` / `.env.staging` / `.env.production`）
- **Gemini key 从客户端搬到 Worker secrets**（`wrangler secret put GEMINI_KEY`）
- YOLO 后端同步迁到 Worker proxy 或自家 GPU 节点
- Apple Sign In 用同一个 Bundle ID（`com.xinray.mealmate`）三 env 共享 —— 不需要 3 个 Bundle ID

### Release 流程区分

- staging build：`eas build --profile preview` → 自动 TestFlight 内部测试
- prod build：`eas build --profile production` → TestFlight 外部测试 → App Store

详见 [`docs/deploy/release.md`](./release.md)。
