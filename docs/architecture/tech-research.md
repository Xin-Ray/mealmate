# mealmate 技术选型调研

> 调研时间：2026-04-21
> 目标：为 mealmate（iOS + Web 双端上线）选择跨平台技术栈。
> 本文档是长版本；PRD 的"技术选型"小节为摘要。

---

## 1. 产品对技术栈的硬性要求

这些需求直接约束可行方案：

1. **iOS 原生应用**（App Store 上架）。进餐提醒、情感化推送是核心玩法，PWA 在 iOS 上的推送限制过多，不能是唯一形态。
2. **Web 版本**（浏览器直接可用）。用户可能在电脑前办公时上传照片、看每周报告，Web 版是一等公民。
3. **本地通知 / 定时提醒**：早中晚餐推送，用户必须在 App 未打开时也能收到。
4. **相机 / 相册访问**：每餐拍照验证、体重秤拍照上传。需要 iOS 权限文案。
5. **云端推送**（APNs）：后续可能需要"机器人 HP 变低时发情感化推送"。
6. **图片上传到后端**：后端需要识别/留存餐食照片。
7. **小团队 / 独立开发者迭代速度**：首个 MVP 要尽快打磨出来，代码库复杂度要可控。
8. **长期维护**：HP 系统、阶段、成就体系会持续迭代；要求能快速调整 UI 与交互。

---

## 2. 候选方案

### 方案 A：React Native + Expo + React Native Web

- **代码复用率**：iOS/Android 约 85–95%；通过 React Native Web 可再复用到浏览器（业务逻辑、组件库），但 Web 端通常仍需单独调整布局。([nucamp.co](https://www.nucamp.co/blog/react-native-vs-flutter-in-2026-which-cross-platform-framework-wins))
- **本地通知 / 定时提醒**：`expo-notifications` 提供成熟的本地通知 API，可 schedule 固定时间触发；iOS/Android 权限流打磨完善。([Expo Docs](https://docs.expo.dev/versions/latest/sdk/notifications/))
- **推送通知**：Expo Push Service 或接 APNs/FCM，生态完整。([reactnativerelay.com](https://reactnativerelay.com/article/react-native-push-notifications-expo-complete-guide-2026))
- **相机 / 相册**：`expo-image-picker` + `expo-camera`；iOS 权限（`NSCameraUsageDescription`、`NSPhotoLibraryUsageDescription`）由 config plugin 处理。([Expo Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/))
- **构建 & 上架**：EAS Build & Submit 一键出 ipa 并提交 App Store，解决 Xcode 痛点。
- **OTA 热更新**：EAS Update 支持不发版上 JS 更新（提醒文案、HP 数值等）。
- **团队语言**：JavaScript/TypeScript，招聘池最大。
- **风险**：React Native Web 在纯 Web 侧体验不如原生 Web 栈（SEO、首屏、深层动画）；复杂动画或手势仍建议写原生模块。

### 方案 B：Flutter + Flutter Web

- **代码复用率**：iOS/Android/Web/Desktop 约 90–95%，一套代码跑多端。([pagepro.co](https://pagepro.co/blog/react-native-vs-flutter-which-is-better-for-cross-platform-app/))
- **Web 成熟度**：Flutter Web 从 2024 年起显著成熟，Flutter 3.41 支持 `--pwa`，自动生成 Service Worker & manifest；2025 年 Dart 直编 WASM，性能接近原生。([dasroot.net](https://dasroot.net/posts/2026/04/flutter-web-building-progressive-web-apps/))
- **本地通知 / 推送**：`flutter_local_notifications` + `firebase_messaging` 是主流组合，成熟稳定。
- **相机 / 相册**：`image_picker` 官方插件，iOS 权限文案需在 Info.plist 配置。
- **UI 一致性**：Flutter 自绘，所有平台像素级一致；对"机器人 mascot 动画"是加分项（Impeller 渲染器稳定 60–120 FPS）。([techaheadcorp.com](https://www.techaheadcorp.com/blog/flutter-vs-react-native-in-2026-the-ultimate-showdown-for-app-development-dominance/))
- **语言**：Dart，学习曲线中等，招聘池比 JS 小。
- **风险**：Flutter Web 的 SEO 仍差（canvas 渲染，爬虫不友好）；如产品后续需要营销页、内容页、Google 可索引页面，Flutter Web 不合适，要额外做一套 Next.js 着陆页。
- **Web bundle 偏大**（WASM/canvaskit），首屏慢于传统 Web。

### 方案 C：Capacitor / Ionic（Web-first，原生壳）

- **思路**：核心是一个 Web App（React/Vue/Angular），Capacitor 把它打包为 iOS/Android 原生壳，通过插件访问 Camera、Push 等。([capacitorjs.com](https://capacitorjs.com/))
- **优势**：Web 与 iOS 共用几乎 100% UI 代码；对已有 Web 技术栈的团队几乎零学习成本。
- **相机 / 推送**：Capacitor 插件成熟，`@capacitor/camera`、`@capacitor/push-notifications`。([capawesome.io](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/))
- **本地通知**：`@capacitor/local-notifications` 可用。
- **风险**：
  - 动画、手势、复杂滚动流畅度不如 RN/Flutter（WebView 层）；
  - App Store 审核对"纯套壳 Web"有门槛，需要有真实原生功能与差异化才能过审；([mobiloud.com](https://www.mobiloud.com/blog/progressive-web-apps-ios))
  - 性能上限较低，机器人复杂骨骼/粒子动画可能吃力。

### 方案 D：纯 PWA（+ 可选 Tauri Mobile / Capacitor 壳）

- **iOS 限制严重**：iOS 16.4+ 才支持推送，且必须用户"添加到主屏幕"之后才能收；无富媒体推送、无后台同步。([magicbell.com](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide))
- **App Store**：Apple 不接受纯 PWA 上架，必须套原生壳（即回到方案 C）。
- **EU 地区**：2024 年 Apple 因 DMA 调整后，EU 的 PWA 不再支持推送。
- **结论**：作为"唯一端"不可行。只适合作为 Web 版形态之一。

### 方案 E：两套代码库（SwiftUI for iOS + Next.js for Web，共享后端）

- **代码复用率**：UI 层 0%，共享只发生在 API / 后端 / 类型定义（可用 OpenAPI 或 tRPC over HTTP）。
- **iOS 体验**：SwiftUI 是 Apple 一等公民，动画、Live Activity、Widget、Watch、HealthKit 接入最佳。若未来想加 Apple Watch 推送"该吃饭了"或 HealthKit 读体重，此路径极顺。
- **Web 体验**：Next.js 是 Web 最成熟栈，SEO、性能、营销页、分享卡片全部开箱。
- **本地通知 / 推送**：iOS 端原生 `UserNotifications` 最完善；Web 端用 Web Push（iOS Safari 仍受限）。
- **风险**：小团队工作量 ×2；两端功能发版容易走偏；设计系统要双份实现。
- **对标**：这是"体验最好、成本最高"的方案。

### 方案 F：原生 iOS（SwiftUI） + 暂不做 Web

不符合用户"iOS + Web day one"诉求，列出仅作对照。若预算极紧可考虑先做 iOS、Web 做极简响应式落地页。

---

## 3. 对比表

| 维度 | RN + Expo + RN Web (A) | Flutter + Web (B) | Capacitor/Ionic (C) | SwiftUI + Next.js (E) |
|---|---|---|---|---|
| iOS/Web 代码复用 | 中高（70–85%，Web 需微调） | 高（85–90%，但 Web SEO 差） | 极高（~95%） | 低（仅后端共享） |
| 本地通知（iOS） | 成熟（expo-notifications） | 成熟（flutter_local_notifications） | 可用（@capacitor/local-notifications） | 原生最佳 |
| 推送（APNs） | 成熟 | 成熟 | 成熟 | 原生最佳 |
| 相机/拍照 | 成熟（expo-image-picker） | 成熟（image_picker） | 成熟（@capacitor/camera） | 原生最佳 |
| 动画 / mascot 表现 | 够用（Reanimated/Lottie） | 最佳（自绘、Impeller） | 受限（WebView） | 最佳（SwiftUI + Metal） |
| App Store 过审 | 无障碍 | 无障碍 | "套壳感"过重可能被退回 | 无障碍 |
| Web SEO / 营销页 | 中等（RN Web 渲染不标准） | 差（canvas/WASM 渲染） | 好（普通 Web App） | 最佳（Next.js） |
| 小团队开发速度 | 快 | 快 | 最快（Web 团队直接上手） | 慢（两端两套） |
| 招聘池 | 大（JS/TS） | 中（Dart） | 大（JS/TS） | 中小（Swift + Next.js 两组） |
| 长期维护 | 稳 | 稳，但 Web 侧小众 | 版本升级有坑 | 最稳，但工时大 |
| 可选 OTA 热更新 | 有（EAS Update） | 社区方案 | 有 | iOS 无，Web 天然 |
| 未来 Watch / Widget / HealthKit | 可接但费力 | 可接但费力 | 难 | 最佳 |

---

## 4. 推荐结论

**首选：方案 A — Expo（React Native）+ React Native Web**

理由：

1. mealmate 的核心玩法——定时提醒 + 拍照验证 + HP 数值变化 + 成就系统——都在 Expo 生态内开箱即用，不需要自己写原生桥。
2. 单人 / 小团队在 TypeScript 一门语言内同时交付 iOS 与 Web，EAS 负责出包与上架，心智负担最低。
3. OTA 热更新对"HP 数值微调、文案调教、机器人情绪线调教"这种频繁微调特别友好，不用每次都送审。
4. React Native Web 足以覆盖"浏览器里看每周报表、查看机器人状态"这种非营销型场景。若未来需要 SEO 着陆页，单独起一个 Next.js 营销站即可，不冲突。

**次选：方案 B — Flutter + Flutter Web**

仅在以下任一条件成立时更优：

- 机器人 mascot 要做大量复杂骨骼/粒子动画，对跨平台像素一致性与帧率有极致要求；
- 团队已经深度使用 Dart；
- 愿意接受 Web 端 SEO/首屏短板，或 Web 仅作为"已登录用户的工作台"。

**不推荐：**

- **Capacitor/Ionic (C)**：对情感化互动 App，WebView 动画与手势体验会拉低质感；且 iOS 审核对纯套壳越来越严。
- **纯 PWA (D)**：iOS 推送/后台限制使其无法承担"定时情感化提醒"这一核心玩法。
- **SwiftUI + Next.js (E)**：体验最佳，但对"先验证产品 PMF 的早期项目"来说工时代价过高；可作为产品验证成功后的 v2 迁移方向。

---

## 5. 后续开放问题

- **OCR 识别体重秤读数** vs **用户手填体重 + 上传照片作为凭证**？前者要调云端 OCR 服务，后者更简单可先用。
- **照片是否需要离线存储并断网重传**？这会影响是否要接入 SQLite / MMKV / IndexedDB。
- **后端 & 账号系统**：Supabase / Firebase / 自建 Node/Python？Expo 与两者集成都有模板。
- **数据隐私 / 合规**：餐食照片和体重属于高敏感数据，若面向中国大陆需考虑 ICP、网络安全法；若面向海外需 GDPR/CCPA。建议数据最小化 + 端到端加密（至少传输加密 + 服务端静态加密）。
- **Apple Watch / Widget / HealthKit 整合** 若列为 v2 目标，需提前在架构上留口子，或接受到时重写 iOS 端。

---

## 6. 参考来源

- [React Native vs Flutter in 2026: Which Cross-Platform Framework Wins? — Nucamp](https://www.nucamp.co/blog/react-native-vs-flutter-in-2026-which-cross-platform-framework-wins)
- [Flutter vs React Native 2026 — Pagepro](https://pagepro.co/blog/react-native-vs-flutter-which-is-better-for-cross-platform-app/)
- [Flutter vs React Native in 2026 — TechAhead](https://www.techaheadcorp.com/blog/flutter-vs-react-native-in-2026-the-ultimate-showdown-for-app-development-dominance/)
- [Building a Cross-Platform App in 2026: Flutter, React Native, or Capacitor? — The Debuggers](https://thedebuggersitsolutions.com/blog/cross-platform-app-2026-flutter-react-native-capacitor)
- [Flutter Web: Building Progressive Web Apps with Flutter — dasroot.net](https://dasroot.net/posts/2026/04/flutter-web-building-progressive-web-apps/)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide (2026) — React Native Relay](https://reactnativerelay.com/article/react-native-push-notifications-expo-complete-guide-2026)
- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [The Push Notifications Guide for Capacitor — Capawesome](https://capawesome.io/blog/the-push-notifications-guide-for-capacitor/)
- [Capacitor by Ionic](https://capacitorjs.com/)
- [PWA iOS Limitations and Safari Support [2026] — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Do Progressive Web Apps Work on iOS? — Mobiloud](https://www.mobiloud.com/blog/progressive-web-apps-ios)
- [React Native vs Swift: Best Way to Build iOS Apps in 2026? — Mobiloud](https://www.mobiloud.com/blog/react-native-vs-swift)
- [SwiftUI vs React Native: Best Framework for iOS Apps 2026 — iSwift](https://www.iswift.dev/comparisons/swiftui-vs-react-native)
- [Expo — Official Site](https://expo.dev/)
