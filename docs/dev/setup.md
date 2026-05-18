# Dev Setup

> 从根目录 [`README.md`](../../README.md) "如何运行"章节扩展。README 保留简短入门版，详细 setup 步骤 + 常见问题在这里。

## 前置条件

- macOS + Xcode 最新版（需要 iOS 18 SDK 才能 build 当前 deployment target）
- Node 18+ + npm
- iOS Simulator（Xcode 自带）或 iPhone 真机
- Apple ID（免费 dev profile 够 simulator/device build；TestFlight 需付费 $99/年 Apple Developer Program）

## 首次安装依赖

```bash
cd app
npm install
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install && cd ..
```

`LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8` 是为了避免 CocoaPods 在中文 locale 下处理 utf-8 路径报错。

## Simulator 上跑（开发用）

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
```

- 首次 build 5–10 分钟（含全部 Pods 编译）
- 装好后 Simulator 自动 boot + 装 app + launch
- Metro server 自动起在 `http://localhost:8081`，热重载 JS 改动

## iPhone 真机上跑

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device          # 让 CLI 列出连着的设备让选
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device <udid>   # 直接指定，避免交互
```

- 首次 8–15 分钟（device target 比 simulator 多一遍 arm64 link + provisioning）
- 后续 incremental build 1-3 分钟

### 前置（一次性）

1. iPhone 用 USB 插 Mac，屏幕解锁，**信任此电脑**
2. Xcode 里打开 `app/ios/mealmate.xcworkspace` → Target `mealmate` → **Signing & Capabilities** → 登录 Apple ID → Team 选 **Personal Team** → Bundle ID 是 `com.xinray.mealmate`
3. iPhone 首次启动 app 会被拦"未受信任开发者"：**设置 → 通用 → VPN 与设备管理 → Apple Development: 你的 Apple ID → 信任**

### 免费 Apple ID 限制

- 装的 app **7 天后过期**，要重新跑 `expo run:ios --device` 刷新。
- 同一台设备最多同时装 **3 个**免费开发 app。

## JS 代码改动（不重 build）

Metro 还在跑的情况下：

- **simulator**：按 `r`（在 Metro 终端）或 `Cmd+R`（在 simulator）reload
- **iPhone 真机**：摇一下手机调出 dev menu → Reload；或者在 Metro 终端按 `r`

热重载（fast refresh）会自动跑，不需要手动 reload，除非改了 `_layout.tsx` / store 等不能热替换的文件。

## 改了 native（npm 装新包 / 加 expo plugin）必须重 build

```bash
cd app/ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
cd ..
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios            # simulator
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device   # 真机
```

判断标准：`package.json` 加了带 native module 的包（带 `ios/` 或 `android/` 目录的）—— 必须重 pod install + 重 build。

## 常见问题

### `xcodebuild error 65: database is locked`

之前的 build 进程没清干净。

```bash
killall xcodebuild 2>/dev/null
killall Xcode 2>/dev/null
rm -rf ~/Library/Developer/Xcode/DerivedData/mealmate-*
```

再重跑 `npx expo run:ios`。

### "No script URL provided" / 启动后 JSON 找不到

Metro 没跑。

```bash
cd app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client
```

### iPhone 连不上 Metro（LAN 不通）

USB 隧道是默认的（应该自动通）。如果还不行：

```bash
cd app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --dev-client --tunnel
```

tunnel 模式走 ngrok，公网可达但速度慢。

### Bundle Identifier 注册失败

bundle id 被占用。改 `app/app.json` 里 `ios.bundleIdentifier` 为其它唯一字符串。

### 真机 build 完装上了但 launch 失败

报 "invalid code signature... profile has not been explicitly trusted"。

→ iPhone 设置 → 通用 → VPN 与设备管理 → Apple Development → **信任**。一次性的，以后不用。

## TestFlight 部署

见 [`docs/deploy/release.md`](../deploy/release.md)。

## 开发者面板（`__DEV__` 守卫）

settings 页底部（仅 dev build 显示）有"开发者面板"。能做：

- HP 5 档切换（0 / 25 / 50 / 75 / 100）
- Stage 1 ↔ 2 切换
- 重置今日三餐 / 重置 onboarding
- 清空饱腹度评分 / 体重历史 / 餐次记录 / 对话历史
- 立即触发餐次提醒（早 / 午 / 晚 各一个 5 秒后弹）
- （feature/stage-transitions 分支）重置过渡屏已看记录

详细 dev 工具见 store `__dev_*` action 列表（`app/src/store/useStore.ts`）。
