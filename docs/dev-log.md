# mealmate 开发日志

> 简明记录每次会话/阶段的进度、验收发现和环境坑。  
> 产品需求详见 [`PRD.md`](./PRD.md)，技术选型见 [`tech-research.md`](./tech-research.md)。

---

## 时间线

### 2026-04-21 — 项目启动
- PRD v0.1 起草（`docs/PRD.md`，10 章）
- 技术调研完成（`docs/tech-research.md`）
- 项目骨架初始化（commit `0eaa9fd`）

### 2026-04-27 — Stage 1 UI shell（mock 数据）
落地内容（commit `9a1c041`）：
- Onboarding 4 屏：`name → schedule → eating → chatgpt`
- Main tabs 4 屏：`home / photo / settings / stage2`
- 状态层：zustand + AsyncStorage 持久化（`app/src/store/useStore.ts`）
- 共享组件：`HpBar` / `Mascot` / `MealCard`
- 对话池：`app/src/data/dialogues.ts`（mock 文案）

**还未接**（PRD 已写但代码缺）：本地推送、相机、ChatGPT/Codex OAuth、真实数据、到点弹窗。

### 2026-04-28 — iOS dev build 验收 + v0.2 反馈

#### 本次提交内容
- 修复依赖错位：
  - `expo-image-picker`：`55.0.19` → `~17.0.11`（错位版本调用 iOS 26+ `PHAsset.contentType` API，Xcode 编译报 `value of type 'PHAsset' has no member 'contentType'`）
  - `@react-native-async-storage/async-storage`：`3.0.2` → `2.2.0`（疑似导致 `useStore.persist.hasHydrated()` 永不为 true，app 卡 splash spinner）
- 新增 `docs/dev-log.md`（本文件）
- `.gitignore` 加入 `.claude/`（Claude Code worktree 缓存目录）

#### 环境/工具链已知坑（非项目 bug，留给后续接手）

1. **CocoaPods 1.16.2 + Homebrew Ruby 4.0.3 unicode bug**  
   直接 `pod install` 报 `Encoding::CompatibilityError: Unicode Normalization not appropriate for ASCII-8BIT`（CocoaPods 还未适配 Ruby 4 的字符串语义）。  
   **绕过**：`LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install`。  
   **长期建议**：用 rbenv 锁 Ruby 3.x，或等 CocoaPods 上游修复后再升回 Ruby 4。

2. **Expo Go 路径有 Account/OAuth 陷阱**  
   `npx expo start --ios`（走 Expo Go 容器）的 dev menu 误触会进 Expo Go 自己的 Account 登录页 → iOS Safari AutoFill 自动填邮箱 → 一路被推到 Google passkey 验证。**mealmate 本身不需要登录**，这是 Expo Go 容器的 UI。  
   **解决**：开发与验收一律用 `npx expo run:ios` 装 native dev build，跳过 Expo Go。

3. **iOS Simulator 摄像头能力**  
   iOS 17+ Simulator 支持 `Features → Camera → Virtual Scene Lite` 或 `Mac Camera`，能为 `expo-image-picker` 的 launchCameraAsync 提供输入。  
   但 mealmate 拍照打卡是核心玩法，**最终验收必须真机**。

#### v0.2 产品反馈（xin，2026-04-28 验收）

> 以下大多是 PRD §4–§5 写过但 Stage 1 UI shell 还未实现的 gap，外加少量新增细化。

| # | 反馈 | 性质 | PRD 章节 |
|---|---|---|---|
| 1 | settings 加**开发者模式**入口（手动触发到点提醒、跳过等待，用于真机调试） | **新增** | — |
| 2 | 三餐到点要有**真实本地推送**，目前完全没接 | gap | §4 阶段一 / §5.1 |
| 3 | **Mascot 形象随阶段变化**：Stage 1 偏瘦弱 → Stage 2 起逐步强壮 → 后续更强 | **新增**（PRD 只写情绪文案，没说外形进化） | §3.2 / §4 |
| 4 | Home 主屏增加**日期 + 一周 7 天周视图**（哪几天三餐齐） | **新增** | §5.6 |
| 5 | **到点弹窗**：单一模态承载完整闭环 — 拍照按钮 + 一句鼓励/名言 + 拍完触发庆祝动画 + HP +0.5 + 弹窗关闭 + 主屏 Mascot 出气泡说一句**结合当前阶段 × HP 区间**的话 | gap | §4 阶段一 / §5.2 |
| 6 | **ChatGPT / Codex OAuth 真实接入**（替换 onboarding/chatgpt 的 mock，让 Mascot 的对话能力接 OpenAI） | gap，需 xin 进一步明确接入范围 | §5.6 / §7 |

#### 验收状态
- iOS dev build 在主 worktree 跑 `npx expo run:ios`（含上面两处依赖修复）。
- ❗ Simulator 上没走完手动验收 — Expo Go 路径 OAuth 干扰 + dev build 路径首次环境配置耗时长。
- 决定：**改在真机上验收 v0.1 + 直接进入 v0.2 迭代**。

---

## 下一步

1. push 当前 main → origin/main（含 Stage 1 commit `9a1c041` + 本次依赖&文档 commit）
2. xin 真机装 dev build 走 v0.1 黄金路径
3. 进入 v0.2 迭代：按上表 1–6 排期
