# mealmate

一款**陪伴式饮食习惯养成 App**：由一只有"HP"的机器人伙伴陪你按时吃饭、吃饱吃好，通过五阶段目标（坚持 → 量化 → 健康增重 → 营养 → 持之以恒），帮助饮食不规律、恢复期或需要健康增重的人群重建三餐节奏。

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
