# mealmate

**Status**: `v1.0.1` (monorepo + stage 4/5 + sync 后端 + issue #2/#4/#5 集成)  ·  iOS only

一款**陪伴式饮食习惯养成 App**：由一只有"HP"的机器人伙伴陪你按时吃饭、吃饱吃好，通过五阶段目标（坚持 → 量化 → 健康增重 → 营养 → 持之以恒），帮助饮食不规律、恢复期或需要健康增重的人群重建三餐节奏。

> 上架进度：见 [`docs/deploy/release.md`](./docs/deploy/release.md) 的 next-step 清单。

---

## 一页纸架构总览

> 给老板 / 产品 / 设计 / 测试 / 研发都看得懂。详细各章节见下方 docs 链接。

### 项目名称
**MealMate** —— 陪伴式健康饮食养成系统。

### 业务目标
通过一个有"血量(HP)"的机器人伙伴 + 五阶段成长机制（坚持 → 量化 → 健康增重 → 营养 → 持之以恒），帮助饮食不规律、需要增重、或处于饮食恢复期的用户长期坚持规律健康饮食。把冷冰冰的数据记录变成有情绪连接的陪伴体验。

### 核心用户
需要规律吃饭、增重、或饮食恢复期的人群 —— **敏感人群重叠**（饮食障碍 / 恢复期用户），产品有「安全与伦理边界」硬约束（详 [`docs/product/prd.md`](./docs/product/prd.md) §八 + §11.L）。

### 核心流程

```
onboarding（设三餐时间 + 给伙伴起名）
   ↓
三餐到点本地推送提醒
   ↓
拍照打卡 HP+5 / 错过 HP-10（gentle mode 减半）
   ↓
加餐补充 HP+10（每日上限 3 次）
   ↓
HP 累到 100 → 进阶下一阶段 + 弹 stage-end 屏
HP 降到 0 以下 → 降阶（stage 1 走 support 调建议医生，§11.L）
   ↓
Stage 2 起记录体重（拍秤面 + Gemini Vision OCR）
   ↓
统计 tab 看趋势图（爱心曲线 + 体重曲线）
```

### 当前架构（v1.0.1）

**Monorepo：客户端 (React Native + Expo) + 自托管后端 (FastAPI + YOLOv8 + SQLite)**

前端 (`app/`)：
- 状态：Zustand v5 + `persist` 中间件
- 持久化：AsyncStorage（key=`mealmate-store`，schema v12；登录后实时往云端 push）
- 推送：`expo-notifications` 本地通知调度三餐提醒
- 图表：`react-native-svg`
- LLM 文案：直连 Gemini API（key 在客户端 bundle，v1.1 迁 CF Worker）
- 体重 OCR：当前直连 Gemini Vision（TestFlight 上挂，v1.1 切本地 PaddleOCR/EasyOCR）
- 食物识别 + Apple Sign-In + 云同步：调后端 `app.flykid.xyz`（CF Tunnel）
- 打包发布：EAS Build → App Store Connect → TestFlight

后端 (`backend/`)：
- FastAPI + uvicorn，GTX 1080 GPU 推理（YOLOv8n COCO 食物类过滤）
- SQLite 3 张表：`users` / `sessions` / `user_data`（store 整包 JSON）
- Apple Sign-In：JWKS 验签 + 自签 session token（sha256 哈希存库）
- 公网入口：Cloudflare Tunnel（cloudflared sidecar，自动 TLS）
- 备份：`scripts/backup.sh` 用 sqlite3 `.backup` 热备份，保留 14 天

### 主要模块

| 模块 | 路由 / 入口 | 说明 |
|---|---|---|
| **首页** | `(main)/home` | HP 心形条 / mascot 状态立绘 / 下一餐倒计时 / 加餐 / 今日记录预览 |
| **记录** | `(main)/records` | 按日期分组的 feed（拍照 / 错过 / 饱腹度 / 加餐 / dialogue） |
| **统计** | `(main)/stats` | 爱心趋势图 + 体重趋势图（stage 2 起） |
| **我的** | `(main)/settings` | 三餐时间 / 机器人名字 / 温柔模式 / 重置 + __DEV__ 开发者面板 |
| **拍照流程** | `(modal)/photo` | 餐次打卡 + Gemini Vision 食物识别 chips + 重拍按钮 |
| **体重录入** | `(modal)/weight-entry` | Stage 2 起，含 OCR 自动读 kg |
| **阶段转场** | `(stage)/stage-{1..5}-{start,end,demote}` | 5 阶段 start/end + 降级 modal，page presentation 全屏 |
| **提醒系统** | `(modal)/meal-{reminder,missed}` + `services/missedScan.ts` | 餐次提醒 + 错过自动扫描 |

详见 [`docs/architecture/modules.md`](./docs/architecture/modules.md) + [`docs/ux-flow.md`](./docs/ux-flow.md) mermaid 全图。

### 外部依赖

| 依赖 | 用途 | 可选性 |
|---|---|---|
| **Gemini API** | LLM 文案生成（mascot 对白） | 可开关（`EXPO_PUBLIC_LLM_ENABLED`），关掉走本地文案池 |
| **自托管后端** | YOLO 食物识别 + Apple Sign-In + 云同步 | YOLO 可选 fail-soft；登录/同步必需后端在线 |
| **Cloudflare Tunnel** | 后端 HTTPS 公网入口（绑 `api.flykid.xyz`） | 必需（iOS ATS 强制 HTTPS） |
| **expo-notifications** | 三餐本地推送 | 必需 |
| **react-native-svg** | 图表 / 图标 | 必需 |
| **EAS Build + ASC / TestFlight** | 构建 / 发布 | 必需 |
| **Apple Developer Program** | 上 App Store 资格 | 必需（$99 / 年） |

### 核心风险

1. **安全伦理（最高优先级）**：敏感用户群体，情感机制设计不当会反向强化焦虑 / 自责。所有文案 / 机制必须遵守 PRD §八 + §11.L —— 例如 stage 1 HP→0 走"建议联系专业医生 / 营养师"的 support 调，而非"再来一次"或惩罚性扣分。文案禁用"奖励 / 失败 / 你让我失望"等强烈词。
2. **API key 暴露**：Gemini key 当前打进客户端 bundle，反编译 ipa 可拿。上线前需迁 **Cloudflare Worker 代理**（v1.1 待办，见 [`docs/architecture/decisions/`](./docs/architecture/decisions/) ADR-004）。后端 endpoint 走 Bearer token（apple sign-in 签发），无 token 直接 401。
3. **单点后端**：后端 + GPU + SQLite 全在一台机器上，机器挂了 = 全服务挂。备份脚本只防数据丢，不防可用性。下一步考虑 D1 + Worker 拆开。
4. **多设备并发写丢数据**：sync 是最后写赢的整包模型，A 设备 push 后 B 设备 push 会覆盖 A 的中间变化。v1 接受（用户量小，多设备少），后续按需做 last-write-wins → CRDT 升级。
5. **无用户数据分析**：当前未接 Sentry / 行为埋点，只能靠 TestFlight crash report + 主动反馈。

### 负责人
**xin**（GitHub: [Xin-Ray](https://github.com/Xin-Ray)）

---

## 版本日志

详细历史见 [`docs/product/changelog.md`](./docs/product/changelog.md) + [`docs/dev-log.md`](./docs/dev-log.md)。

### v1.0.1 — 2026-05-30

一次大合并：把 `feat/stage-4-5-ui` (含 v1.1 stage 3/4/5 + stats + celebration) +
sync 后端集成 + monorepo restructure 全部进 main，作为 TestFlight 第二个里程碑。

**v1.0 → v1.0.1 主要变化**：

- 🏗️ **Monorepo**：后端从独立目录 (`/home/xin/document/mealmate/backend/`) 整体迁进
  `mealmate-app/backend/`，前后端在同一仓库管理。详 `chore/monorepo-backend` 分支
- 🎨 **Stage 3/4/5 UI**：HomeStage3/4/5 + WeightCard + StarRating + WeeklyFoodProgress + targetWeight 进度环
- 📊 **统计 tab**：3 个图表 × 周/月/全部 子 tab
- 🎉 **CelebrationModal**：拍照打卡庆祝弹窗（Reanimated，Figma 32:1637）
- 👤 **Onboarding profile 步**：身高 + 性别 + 族裔，BMI → standardWeight 计算
- 🔐 **Apple Sign-In + 云同步**：FastAPI 后端 + SQLite，store 整包 push/pull
- 🍽️ **Snack**：每日上限 3 次（之前 2），加餐 +10 HP
- ✏️ **issue #2 修文案**：拍照失败提示去 raw error，按场景翻译
- 🐛 **fixes**：餐窗 / 提醒 / onboarding 漏餐误判（issue #6/#7）

**已知 issue / 进度**（截至 v1.0.1 tag）：

| # | 标题 | 状态 |
|---|---|---|
| #1 | NextMealCard 跳过 done | ✅ 已修（v1.0） |
| #2 | 拍照识别页问题 | ✅ 文案修了（v1.0.1）；公网联调 + EAS env 注入 GEMINI_KEY 待 |
| #3 | 加餐机会 | ✅ 已合（v1.0.1，每日上限 3 次） |
| #4 | 云端数据库 / 备份 | ✅ 后端 + 同步代码集成（v1.0.1）；公网部署中 |
| #5 | 数据存储 | ✅ 与 #4 同（v1.0.1） |
| #6 | 时间提醒（窗口 + 偶尔不响 + 窗末 30min）| 🟡 已修 v1.0.1，待真机验证 |
| #7 | onboarding 完即弹错过餐 | 🟡 已修 v1.0.1，待真机验证 |
| - | 体重 OCR (TestFlight 挂) | 🟠 根因已确认 (EAS env)；v1.1 切本地 PaddleOCR/EasyOCR |

### v1.0.0 — 2026-05-18

TestFlight build 1 上线。Stage transitions 11 屏 + NextMealCard + Weight OCR + YOLO 食物识别 + Stage 1 HP→0 走 support 调。详 [`docs/product/changelog.md`](./docs/product/changelog.md)。

---

## 项目结构

Monorepo，前后端在同一个 repo 共存：

```
mealmate-app/
├── app/             # 前端（React Native + Expo）
│   ├── src/
│   ├── app/         # expo-router 文件路由
│   ├── package.json
│   └── .env.example
├── backend/         # 后端（FastAPI + YOLOv8 + SQLite，issue #4/#5 v1.1）
│   ├── app/         # Python 包（main / auth / db / detector）
│   ├── models/      # YOLO 权重
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
└── docs/            # 共享文档（PRD / API / 架构 / dev-log）
```

> 旧的"前端独立、后端在 `/home/xin/document/mealmate/` 单独跑"的双仓库布局已弃用，2026-05-30 合进 monorepo（分支 `chore/monorepo-backend`）。

- [`docs/PRD.md`](./docs/PRD.md) — 产品需求文档
- [`docs/api.md`](./docs/api.md) — 后端 HTTP API 契约
- [`docs/tech-research.md`](./docs/tech-research.md) — 跨平台技术栈调研
- [`docs/architecture/account-sync.md`](./docs/architecture/account-sync.md) — 账号系统 + 云端同步设计
- `app/` — 前端（详 `app/` 下 CLAUDE.md）
- `backend/` — 后端（详 [`backend/README.md`](./backend/README.md)）

## 如何运行

### 前置条件

- macOS + Xcode 最新版（前端需要）
- Node 18+ + npm（前端）
- Python 3.10+ + pip（后端，dev / prod 都装在后端机器上）
- iOS Simulator 或 iPhone 真机
- Apple ID（免费够 dev build，付费才能 TestFlight）
- 后端可选：GPU + CUDA 12.1（GTX 1080 及以上够用），没 GPU 也能跑 CPU 慢一点

### 前端（React Native + Expo）

```bash
cd app
npm install
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios            # simulator
# 真机：npx expo run:ios --device
```

详细启动步骤、热重载、TestFlight 部署见下面 §"如何运行（详细）"。

### 后端（FastAPI + YOLO + Auth + Sync）

```bash
cd backend
python3 -m venv .venv
# torch CUDA 12.1 wheel 必须先单独装（GTX 1080 cuDNN 8 兼容）
.venv/bin/pip install torch==2.3.1 torchvision==0.18.1 \
  --index-url https://download.pytorch.org/whl/cu121
.venv/bin/pip install -r requirements.txt
cp .env.example .env

# dev (auto-reload)
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# prod (systemd)
sudo cp mealmate.service /etc/systemd/system/
sudo systemctl enable --now mealmate
```

健康检查：`curl http://localhost:8000/health` → `{"status":"ok","device":"cuda:0","model_loaded":true}`

详 [`backend/README.md`](./backend/README.md) + [`docs/api.md`](./docs/api.md)。

---

## Bundle ID / 双环境约定

mealmate 用两套 iOS bundle ID 隔离 TestFlight 用户跟本地开发：

| 用途 | Bundle ID | App 名 | 数据 namespace |
|---|---|---|---|
| **production**（TestFlight + App Store）| `com.xinray.mealmate` | MealMate | `mealmate-store` |
| **dev**（本地 Xcode dev build）| `com.xinray.mealmate.dev` | MealMate Dev | `mealmate-store-dev` |

两个 ID 在 iOS 系统里被当成不同 app，可以**同机并存**：xin 真机上 TestFlight 版的 MealMate 跟本地装的 MealMate Dev 互不覆盖、AsyncStorage 数据互不可见。

### 实现机制

**iOS native 层**：直接编辑了 `app/ios/mealmate.xcodeproj/project.pbxproj`，让两个 XCBuildConfiguration 各自带不同 bundleId：

```
Debug   config (mealmate target): PRODUCT_BUNDLE_IDENTIFIER = com.xinray.mealmate.dev
Release config (mealmate target): PRODUCT_BUNDLE_IDENTIFIER = com.xinray.mealmate
```

这样 `npx expo run:ios` 默认 Debug → 装 `.dev` bundle；EAS `preview` / `production` profile 走 Release → 装 prod bundle。

**JS 层**：`app/src/store/useStore.ts` 按 `APP_VARIANT` env 切 AsyncStorage `STORE_KEY`（数据 namespace 隔离）。

### ⚠️ 已知 fragility

- `app/ios/` 整目录在 `.gitignore`（expo 规范），所以 pbxproj 改动**不在 git 里**：
  - 新机器 clone 仓库后 `ios/` 是空的，需要跑 `npx expo prebuild` 重新生成 → 生成出来的 pbxproj 是默认的（bundleId 单值 prod，不带 `.dev`）→ 需要再手动 patch 一次
  - 反过来，谁要是不小心跑了 `npx expo prebuild --clean` 会**覆盖**当前手改的 pbxproj
- 当前靠 xin 本机的 pbxproj 文件保留 `.dev` 配置；其他 dev / CI 拉代码后需要重新 patch

### 长期 fix 思路（v1.2+ 待办）

写一个 expo config plugin（`app/plugins/withBundleIdSuffix.js`）在 prebuild 时声明式地 patch pbxproj。这样 plugin 跟着 git 走，新 clone 跑 `expo prebuild` 自动生效。

原型在 `backup/local-env-split-attempt` 分支 commit `9d35be2`，里面有 `withXcodeProject` 实现可参考。当前 main 没用这条路（xin r3 决定先走"直接编辑 pbxproj"简化版）。

---

## 如何运行（详细）

### 首次安装依赖（前端）

```bash
cd app
npm install
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
```

### Simulator 上跑（开发用）

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
```

首次 build 5–10 分钟（含 Pods 编译）。装好后 simulator 自动启动 + 装 app + launch。

### iPhone 真机上跑

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device
```

CLI 会列出连着的 iPhone 让选。首次 8–15 分钟。

**前置（一次性）**：

1. iPhone 用 USB 插 Mac，屏幕解锁，信任此电脑
2. Xcode 里 `app/ios/mealmate.xcworkspace` → Target mealmate → Signing & Capabilities → 用 Apple ID 登录 → Team 选 Personal Team → Bundle ID 是 `com.xinray.mealmate`
3. iPhone 首次启动 app 会被拦"未受信任开发者"：设置 → 通用 → VPN 与设备管理 → Apple Development: 你的 Apple ID → 信任

**注意**：免费 Apple ID 装的 app 7 天后过期，要重新跑 `expo run:ios --device` 刷新；同一台设备最多同时装 3 个免费开发 app。

### JS 代码改动（不重 build）

Metro 还在跑的情况下：

- simulator 上：按 `r` 或 `Cmd+R` reload
- iPhone 真机：摇一下手机调出 dev menu → Reload；或者打开 Metro 终端按 `r`

### 改了 native（npm 装新包 / 加了 expo plugin）后必须重 build

```bash
cd app/ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
cd ..
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios            # simulator
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device   # 真机
```

### 常见问题

**`xcodebuild error 65: database is locked`**：之前的 build 进程没清干净。

```bash
killall xcodebuild 2>/dev/null
killall Xcode 2>/dev/null
rm -rf ~/Library/Developer/Xcode/DerivedData/mealmate-*
```

再重跑命令。

**"No script URL provided" / 启动后报 JSON 找不到**：Metro 没跑。开终端跑：

```bash
cd app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client
```

**iPhone 连不上 Metro（LAN 不通）**：用 USB 隧道（默认开启）或者改用 tunnel 模式 `npx expo start --dev-client --tunnel`。

**Bundle Identifier 注册失败**：bundle id 被占用。改 `app.json` 里 `ios.bundleIdentifier` 为其它唯一字符串。

### TestFlight 部署（脱离 Mac 长期可用）

需付费 Apple Developer Program $99/年 + EAS Build：

```bash
npm i -g eas-cli
eas login
eas build --platform ios --profile preview
```

详见 `docs/v0.4-test-plan.md` 和 [Expo 文档](https://docs.expo.dev/build/setup/)。

## 快速结论

- **推荐技术栈**：React Native + Expo + React Native Web（iOS + Web 一套 TypeScript 代码）
- **MVP 建议**：优先完整打磨阶段一——HP 系统、三餐推送、拍照验证、到 22 解锁阶段二的完整闭环
- **需要尽早决定**：阶段四/五机制、文案 tone 基线、是否规划 Apple Watch/HealthKit

> 草稿版本 v0.1，欢迎讨论。
