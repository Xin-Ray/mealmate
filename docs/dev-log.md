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
| 6 | **Mascot 文案接 LLM**（替换 mock dialogues），让对话按 stage × HP × 行为生成 | gap | §5.6 / §7 |

#### 验收状态
- iOS dev build 在主 worktree 跑 `npx expo run:ios`（含上面两处依赖修复）。
- ❗ Simulator 上没走完手动验收 — Expo Go 路径 OAuth 干扰 + dev build 路径首次环境配置耗时长。
- 决定：**改在真机上验收 v0.1 + 直接进入 v0.2 迭代**。

---

## Mascot LLM 接入决策（2026-04-28，对应反馈表 #6）

### 候选方案对比

| 方案 | 用户成本 | 开发者成本 | 工程量 | 质量 | 选 |
|---|---|---|---|---|---|
| 用户自填 OpenAI API key | 要钱 | 0 | 小 | 优 | ❌ 用户不接受 |
| 抄 OpenClaw：复用 Codex CLI 公开 client_id（PKCE + loopback） | 0（ChatGPT 订阅 cover） | 0 | 大（mobile 上 loopback `127.0.0.1` 需 WebView 拦截） | 优 | ❌ Apple 审核 + OpenAI 政策双重风险 |
| iOS 内置 on-device 开源 1B–2B 模型（MLX / llama.cpp） | 0 | 0 | 中 | 中下 | ❌ 包体积 +1GB / 老机型卡 / 文案质量差 |
| **Gemini 2.0 Flash free tier，开发者一个 key 服务所有用户** ✅ | 0 | ~0 | 小 | 优 | ✅ |

### Codex OAuth 复用（OpenClaw 路径）的事实记录

- OpenAI Codex CLI 的 OAuth client 是公开的：`client_id = app_EMoamEEZ73f0CkXaXp7hrann`，PKCE，redirect 是 `http://127.0.0.1:1455/auth/callback`（loopback）。
- OpenAI 在 docs 里 explicitly 允许第三方在 Codex CLI 之外复用，OpenClaw 就是这样做的。
- 但对 mealmate（iOS native）有三个坑：① loopback 在手机上不通用，需 WebView 拦截；② redirect URI 注册时固定，不能换 `mealmate://` scheme；③ Anthropic 已经收紧 Claude OAuth 复用（2026-03），OpenAI 跟进只是时间问题。
- 决定：**不走这条**。

### Gemini Flash 方案落地

**dev 阶段**（已实现，等 xin 粘 key 即可生效）：
- `app/.env.local`（gitignored）放 `EXPO_PUBLIC_GEMINI_KEY=...`
- `app/src/services/mascotLlm.ts`：调 `gemini-2.0-flash` 的 `generateContent`，按 stage × HP × 餐次组 prompt，system prompt 内置 PRD §8 安全边界（禁"消失/不见"硬性威胁）
- `app/app/(main)/home.tsx`：mascot 气泡先尝试 LLM；失败 / 无 key / 网络错 fallback 到 `dialogues.ts` 的 mock
- 模型选择：**`gemini-2.5-flash-lite`** —— 当前 Gemini family 最便宜+最快；每次 input ~50 token + output ~30 token
- ⚠️ **不要**用 `gemini-2.0-flash`：新申请的 free tier key 在该模型上 quota=`limit: 0`（Google 2025 末把流量推向 2.5 系列）。验收时实测 2.0-flash 直接 HTTP 429，2.5-flash-lite 正常返回
- 配额测算：单 key 撑 ~300 DAU 量级；撑爆再申请第二个 key 或上付费（~$0.02/1000 DAU/day）

**上线前必做（TODO，反馈表 #6 完成的硬性前置）**：
- 部署 Cloudflare Worker 代理：`mealmate-ai.<account>.workers.dev`
  - key 存 Worker env var，不进客户端
  - 客户端只需把 `mascotLlm.ts` 里的 endpoint 换成 worker URL
  - Worker 加 per-IP 或 per-device-id rate limit（10/min）
- 工程量预估：30 行 JS + 10 分钟部署
- 触发时机：closed beta 结束、准备真用户上线前

### 安全事件：API key 在 chat 中暴露（2026-04-28）

xin 在 chat 中直接贴出了第一个 Gemini API key（`AIzaSy...`，前缀只记到此处）。处置：
- 已请 xin 立刻去 https://aistudio.google.com/apikey **revoke 该 key**
- 新 key 由 xin 自己粘到 `app/.env.local`，不再过 chat

经验：上线前的 Worker 代理是这件事的根本解 —— 即使将来 key 被反编译也只能命中 Worker，不会泄露真 key。

---

## 下一步

1. xin **revoke** 第一个 key，**新建**一个，粘到 `app/.env.local`
2. xin 重 build：`cd app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios`（首次后 cache，后续秒级）
3. xin 真机装 dev build 走 v0.1 黄金路径，验证 mascot 文案是否生动
4. 反馈表 #6 完成 → 继续推 #1–#5（周视图 / Mascot 阶段形象 / 到点弹窗 / 本地推送 / 开发者模式）

---

## B1 验收备忘

`expo-notifications` 已经接通：
- 三餐时间到点用 DAILY trigger 调度，body 取自 `dialogues.ts` 的 mock 文案（按当前 HP band + slot）
- onboarding 完成 / schedules 改 / hp 改 → 自动 reschedule
- 用户点通知 → expo-router 路由到 `/(main)/photo?slot=...`（A3 后是 modal 弹起）
- settings 开发者面板有"立即触发"3 个按钮（早午晚），5 秒后弹一条测试推送

**iOS Simulator 从 Xcode 11.4 起完整支持本地通知**（调度 / 横幅 / 锁屏 / 点击 / data payload 全模拟）。本地推送不是 APNs 远程推，可以在 simulator 上端到端验。

**安装新 native package 后必须重 pod install + run:ios**：
```
cd app/ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
cd .. && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
```

v0.2 收尾时所有项一并在真机扫一遍（不是 B1 单独的硬性要求）。
