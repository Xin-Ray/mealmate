# ADR-0001：选择 Expo 而非 bare React Native

- 日期：2025-08（项目启动）
- 状态：accepted
- 决策人：xin

## 背景

要做一个 iOS / Android 双端 app，xin 是单人开发，目标是 6 周内出 MVP TestFlight。技术栈选型：React Native vs Flutter vs SwiftUI（iOS only）。

React Native 选定后，再选发行方式：
- **Bare RN**：原生 iOS / Android 项目 + RN bridge，需手动配 Xcode / Android Studio
- **Expo**：托管原生层，CLI + EAS Build 云构建

## 决策

选 **Expo SDK 54**（managed workflow，必要时 expo dev client + 局部原生模块）。

## 理由

- **单人开发节奏**：管理 iOS 证书 / Provisioning / Cocoapods / Gradle 太重，每次都要花半天
- **EAS Build 云构建**：本地不用配 Xcode 完整环境（虽然测试要用），CI / 远端构建顺畅
- **Expo Router 6**：file-based routing 跟 Next.js 体验一致，减少决策疲劳
- **OTA 更新**（v1.1+ 计划）：bug fix 不用重新过 App Review
- **Expo 生态**：expo-camera / expo-notifications / expo-image-manipulator 等开箱即用，省去 RN 找 lib 的时间

## 取舍

接受的缺点：
- **bundle 偏大**：Expo Go runtime ~30MB，最终 .ipa 大；可接受
- **某些原生 lib 需 dev client**：Sentry / 复杂 SDK 要切 dev client（非 Expo Go）
- **Expo runtime 升级偶尔有 breaking**：SDK 升级前看 migration guide

放弃的：
- Bare RN 的最大自由度
- 直接对接 Cocoapods 第三方库
- 完全自控的 build pipeline

## 后果

- 6 周 MVP 节奏跑下来证明选型对 —— xin 几乎没碰过 Xcode 配置
- v1.0 上架前需评估是否要 eject（如果 OTA 想接入第三方 lib 但 Expo 不支持）
- 长远（v2+）如果接入复杂原生功能（HealthKit 深度集成 / 系统级 widget），考虑 eject 或 expo prebuild

## 相关

- [01-architecture.md](../01-architecture.md)
- [ADR-0004](./0004-zustand-state.md)（状态管理选型相关）
