# mealmate

**Status**: `v1.0.1` — in progress (餐窗 / 提醒 hotfix)  ·  main `4a94da2`  ·  iOS only

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
加餐补充 HP+10（每日上限 2 次）
   ↓
HP 累到 100 → 进阶下一阶段 + 弹 stage-end 屏
HP 降到 0 以下 → 降阶（stage 1 走 support 调建议医生，§11.L）
   ↓
Stage 2 起记录体重（拍秤面 + Gemini Vision OCR）
   ↓
统计 tab 看趋势图（爱心曲线 + 体重曲线）
```

### 当前架构（v1.0）

**纯客户端 React Native + Expo**，**无后端**：
- 状态：Zustand v5 + `persist` 中间件
- 持久化：AsyncStorage（数据仅存本地设备，key=`mealmate-store`，schema 已 migrate 到 v9）
- 推送：`expo-notifications` 本地通知调度三餐提醒
- 图表：`react-native-svg`
- LLM 文案 + 体重 OCR：直连 Gemini API（key 在客户端 bundle，可关）
- 食物识别：自托管 YOLO 后端（可选，fail-soft）
- 打包发布：EAS Build → App Store Connect → TestFlight

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
| **Gemini API** | LLM 文案生成 + Vision 体重 OCR | 可开关（`EXPO_PUBLIC_LLM_ENABLED`），关掉走本地文案池 / 手填 kg |
| **自托管 YOLO 后端** | 食物识别 | 可选，后端挂时 fail-soft（不阻塞打卡） |
| **expo-notifications** | 三餐本地推送 | 必需 |
| **react-native-svg** | 图表 / 图标 | 必需 |
| **EAS Build + ASC / TestFlight** | 构建 / 发布 | 必需 |
| **Apple Developer Program** | 上 App Store 资格 | 必需（$99 / 年） |

### 核心风险

1. **安全伦理（最高优先级）**：敏感用户群体，情感机制设计不当会反向强化焦虑 / 自责。所有文案 / 机制必须遵守 PRD §八 + §11.L —— 例如 stage 1 HP→0 走"建议联系专业医生 / 营养师"的 support 调，而非"再来一次"或惩罚性扣分。文案禁用"奖励 / 失败 / 你让我失望"等强烈词。
2. **API key 暴露**：Gemini key 当前打进客户端 bundle，反编译 ipa 可拿；YOLO 后端无鉴权。上线前需迁 **Cloudflare Worker 代理**（v1.1 待办，见 [`docs/architecture/decisions/`](./docs/architecture/decisions/) ADR-004）。
3. **数据无备份**：用户数据仅存本地 AsyncStorage，**卸载 / 换机即丢**，无云同步。`resetAll`（"删除账号"）= 清本地。v1.1+ 后端 + Apple Sign In 规划，见 [`docs/architecture/database.md`](./docs/architecture/database.md)。
4. **无用户数据分析**：当前未接 Sentry / 行为埋点，只能靠 TestFlight crash report + 主动反馈。

### 负责人
**xin**（GitHub: [Xin-Ray](https://github.com/Xin-Ray)）

---

## 版本日志

详细历史见 [`docs/product/changelog.md`](./docs/product/changelog.md) + [`docs/dev-log.md`](./docs/dev-log.md)。

### v1.0.1（进行中，`fix/issues-6-7-meal-timing` 分支）

**修**：餐窗起点 / 提醒通知 / onboarding 漏餐误判（来自 2026-05-22 真机反馈）

- 餐窗定义从「提醒时间 ±90 分钟」改成「提醒时间起 +90 分钟」（之前提前 1.5h 显示提醒卡是 bug，Issue #6c）
- 每餐加一条「窗末前 30 分钟」二次本地通知（Issue #6b 新需求；顺带兜底 6a iOS DAILY trigger 偶发不响）
- `store.onboardingCompletedAt` 字段（v9 → v10 migrate）+ missedScan 守卫：onboarding 完成时已过完的窗不再 mark missed（Issue #7）

**已知 issue / 进度**：

| # | 标题 | 状态 |
|---|---|---|
| #1 | NextMealCard 跳过 done | ✅ 已修（v1.0） |
| #2 | 拍照识别页问题 | ✅ 已修（v1.0，重拍按钮 + YOLO） |
| #3 | 加餐机会 | 🟡 `feat/issue-3-snack-card` 分支待合 |
| #4 | 云端数据库 / 备份 | ⬜ v1.1 计划 |
| #5 | 数据存储 | ⬜ v1.1 计划（与 #4 同方向） |
| #6 | 时间提醒（窗口 + 偶尔不响 + 窗末 30min 提醒）| **🟡 已修 v1.0.1，待 xin 真机验证** |
| #7 | onboarding 完即弹错过餐 | **🟡 已修 v1.0.1，待 xin 真机验证** |

### v1.0.0 — 2026-05-18

TestFlight build 1 上线。Stage transitions 11 屏 + NextMealCard + Weight OCR + YOLO 食物识别 + Stage 1 HP→0 走 support 调。详 [`docs/product/changelog.md`](./docs/product/changelog.md)。

---

## 项目结构

- [`docs/PRD.md`](./docs/PRD.md) — 产品需求文档（一句话概述、目标用户、HP 机制、五阶段设计、MVP 范围、技术选型摘要、安全与伦理边界、待决策项）
- [`docs/tech-research.md`](./docs/tech-research.md) — 跨平台技术栈调研（React Native / Flutter / Capacitor / PWA / SwiftUI+Next.js 对比，含来源链接）
- `app/` — 代码占位，技术栈敲定后初始化

## 如何运行

### 前置条件

- macOS + Xcode 最新版
- Node 18+ + npm
- iOS Simulator 或 iPhone 真机
- Apple ID（免费够 dev build，付费才能 TestFlight）

### 首次安装依赖

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
