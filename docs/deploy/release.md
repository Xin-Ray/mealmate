# Release

## 当前 v0.4 — 手动 dev build

每次给 xin 看新代码：

```bash
cd app
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios --device <udid>
```

- 装到 iPhone，免费 dev profile 7 天过期，每周重 build 一次。
- Metro 跑着就能 fast refresh JS 改动（不必重 build）。
- 完整步骤见 [`docs/dev/setup.md`](../dev/setup.md)。

## v0.5+ 预案 — EAS Build + TestFlight

### 前置（一次性）

1. 付 Apple Developer Program $99/年
2. `npm i -g eas-cli && eas login`
3. `eas build:configure` → 生成 `eas.json`（preview / production 两 profile）
4. 在 App Store Connect 建 app + bundle ID

### 发布流程

```bash
cd app
# 1. 跑测试 + 全量 tsc 检查
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx tsc --noEmit

# 2. 触发云 build
eas build --platform ios --profile preview   # TestFlight internal
# 或
eas build --platform ios --profile production  # App Store

# 3. submit
eas submit --platform ios --latest

# 4. 在 App Store Connect 加 TestFlight beta 群组邀请
```

### Release 节奏（v1.0 目标）

- TestFlight internal：每 commit 自动 build（CI 触发 `eas build`）
- TestFlight external：每周 1 个 build，邀请 100 名 beta 用户
- App Store：每 4-6 周 1 个版本

## CHANGELOG 同步

每发 release：

1. 更新 [`docs/product/changelog.md`](../product/changelog.md)（按 Added / Changed / Fixed 归类）
2. App Store Connect "What's New" 复制 changelog 的"用户可见改动"
3. 客户端 settings 页加"版本号 + 本次更新内容"链接（v0.5+）

## OTA hotfix（紧急 JS 修复）

`expo-updates` 配置后可以**不走 App Store 审核**直接推 JS bundle 修复（限制：不能改 native 代码）：

```bash
eas update --branch production --message "hotfix: <一句话>"
```

仅用于 P0 bug —— 避免滥用绕过 App Store 审核合规。
