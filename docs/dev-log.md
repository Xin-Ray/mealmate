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

---

## A1 周视图实现

home 屏在 mascot 立绘上方加了一条「周一→周日」的 7 列条带（`src/components/WeekStrip.tsx`），含：
- 顶部当前日期 + 周几（中文）
- 7 列：`一/二/三/四/五/六/日` + 几号
- 今天用 accent 色边框 + 浅色底高亮，未来天 opacity 40%
- 每列底部 3 个小圆点表示该天三餐 done 数（done=ok 色，未 done=hpEmpty 色）

数据层：
- `useStore` 加 `mealHistory: Record<string, TodayMeals>` 字段，`rollDayIfNeeded` 时把昨天的 `todayMeals` 归档进来，最多保留最近 30 天
- 老用户持久化数据缺 `mealHistory` 字段时 zustand persist 会从 initialState 拿默认 `{}`，向后兼容
- WeekStrip 渲染时今天读 `todayMeals`，其它天读 `mealHistory[key]`

---

## Bug 复盘：stage2 自动跳转死循环（2026-04-29）

### 现象
用户用 settings 开发者面板把 Stage 切到 2，App 立刻卡在 `/(main)/stage2` 屏，"回到首页"按钮按下视觉无变化（实际跳了 home 又被立刻弹回 stage2），出不去。
日志中 mascot LLM 前 4 次成功，紧接着 3 次连续 `AbortError`——和卡死时间点严丝合缝。

### 根因
死循环是 Stage 1 UI shell（`9a1c041`，4-27）就埋下的，B2（开发者模式 stage 切换）首次让它能轻易复现：

```
home.tsx        useEffect → 见 currentStage===2 → router.replace('/stage2')
stage2.tsx      "回到首页"按钮 → router.replace('/home')
                   ↑                          ↓
                   └──────── replace 环 ───────┘
```

`router.replace` 两边互相替换 → home 立即 unmount → home 上的 LLM `AbortController` 被 `return () => ctrl.abort()` 触发 → fetch 抛 `AbortError`。LLM 不是出问题，是被这个循环连累着每次都 abort。

升 Stage 2 走正常路径（HP 累积到 15 → `advanceStage`）也会触发同样的环，只是没人轻易触发。

### 修法（commit `<see git log>`）
1. 删 `home.tsx` 那个 `if (currentStage===2) router.replace('/stage2')` 的 useEffect
2. 在 home 上挂一个手动入口 `查看 Stage 2 ▸`（仅 `currentStage===2` 显示），调 `router.push('/stage2')`，stage2 屏作为可选占位页
3. stage2 的"回到首页"按钮保留 `router.replace('/home')`——home 不再有 redirect 守卫，回得去

### 怎么避免下次重蹈
- 任何"读 store 状态 → 自动 `router.replace/push`"的 effect，必须在**目标屏自身**也排除掉自己（不然两边互相跳）
- 每个被 effect 强制 push 的目标屏，**必须有 escape hatch**：要么改 store 让条件不再成立，要么有按钮直接跳到不被 redirect 的中性屏（比如 settings）
- 自动跳转尽量用 `Redirect` 组件（声明式）而不是 useEffect 里 imperative 调用，前者 React 调度更可控
- 加新自动跳转 effect 时心里走一遍闭环：A→B 之后 B 怎么回 A，B 回 A 时 A 还会不会再跳 B

---

## 临时关闭 LLM（2026-04-29）

### 现状
xin 的 Gemini API token 在调试中用光（free tier 配额）。为了把 v0.2 剩下的项继续在 simulator 上验，**临时全量走 mock 文案**。

### 实现
全局开关 `EXPO_PUBLIC_LLM_ENABLED`（`app/.env.local`）：
- 缺失或非 `"true"` 都视为关闭
- 关闭时 `generateMascotLine()` 第一行返回 `null`，调用方按现有 fallback 链自动走 `dialogues.ts` mock（24 条池子，4 区间 × 3 餐 × 2 变体，够用）
- 当前默认 `false`

调用点都已验证 null 安全：
- `app/(main)/home.tsx`：greeting 优先用 `llmLine`，null 时回 `fallbackGreeting?.text`，再回 `"今天也一起吃饭吧～"`
- `app/(main)/photo.tsx`：result phase 进入时已经先用 `pickDialogue` 设了 mock line，LLM 返回 null 时不动 line（保持 mock）

### 想开回 AI
1. 编辑 `app/.env.local`：`EXPO_PUBLIC_LLM_ENABLED=true`
2. Metro 按 `r` reload（env var 是 build/bundle 时读，reload 即可，不用重 native build）
3. Metro log 应该看到 `[mascotLlm] calling Gemini, key prefix: AIzaSy`，关闭时则是 `[mascotLlm] LLM_ENABLED=false — fallback to mock`

### 回头调 AI 时要做的事（v0.3 候选）
- [ ] 在 settings 开发者面板加一行"LLM 状态"显示（读 `process.env.EXPO_PUBLIC_LLM_ENABLED`），免得忘了开关位置
- [ ] **Cloudflare Worker 代理提前**：dev 期就接上，key 移到 server 端 + 加 rate limit + per-device 配额。这样 token 出问题时是 worker 那边可观测可降级，不用动客户端开关
- [ ] quota 监控：worker 上加日志输出每天调用量、HTTP 429/403 计数，达阈值发 webhook
- [ ] mascot 文案缓存：同一 (stage × HP band × slot) 24 小时内复用一次 LLM 结果，减少调用

---

## v0.3 启动（2026-05-01）

### 这一轮做了什么 — Stage 2 体重模块（PRD §4.2 / §5.4）

**数据层**（`useStore`）
- 新增 `WeightRecord` 类型（`src/types/index.ts`）：`{ date, kg, photoUri, recordedAt }`，按 date dedupe
- `weightHistory: WeightRecord[]` —— 按 date 升序，最多保留 90 天（量级与 `mealHistory` 一致）
- `skipWeightPhoto: boolean` —— settings 里的"称重跳过拍照"开关，默认 false（按 PRD §5.4 强制要求拍）
- actions: `addWeightRecord({kg, photoUri})`、`setSkipWeightPhoto(v)`、`__dev_clearWeightHistory()`
- `addWeightRecord` 内部用 `todayKey()` 算 date，同 date 已有则覆盖（每日一条）

**新屏：`weight-entry.tsx`**（modal 路由，`(main)/_layout.tsx` 配 `presentation: 'modal'`）
- 三阶段 + skip-photo 分支：
  - `skipWeightPhoto=false`：`intro`（拍秤 / 相册）→ `preview`（图 + 数字输入 + "确定 / 重拍"）→ `uploading`（500ms 模拟）→ `result`（HP +0.5 弹跳 + Mascot 一句话 + "完成"）
  - `skipWeightPhoto=true`：跳过 intro，直接 `preview`（无图，纯数字 + "确定 / 清空重填"）
- 数字校验：20–250 kg，精度 0.1（`Math.round(kg * 10) / 10`）
- "确定"按钮在「图 + 数字」都齐时才点亮（skip 模式下只看数字）
- 中途退出守卫：用户已经输了数字或拍了照但没点确定 → Alert 警告"会丢掉这次记录"
- 复用 `src/services/imagePicker.ts` 的 `pickImageWithFallback`（simulator 无相机 → 弹 Alert 转相册），跟 `photo.tsx` 共用一份 picker 逻辑

**`photo.tsx` 跟着 refactor**：原本 inline 的权限 + try/catch + simulator fallback 全抽到 `pickImageWithFallback`，photo 里的 `pickImage` 缩成 4 行

**Stage 2 仪表板（`stage2.tsx`）**
- `currentStage===1` 进来：保留"完成 Stage 1 后解锁"占位，Mascot stage=2 + 一行解释 + "回到首页"
- `currentStage===2` 进来：
  - 头部：阶段 2 · 量化 标题 + Mascot
  - 「最近一次」卡片：大字 kg + 副标日期/时间 + 较上次 delta（`+0.3 kg` / `-0.1 kg` / `持平`）
  - 「最近 7 天」柱状条：纯 RN `<View>` 滚动 7 天（最右是今天），无数据的天用 hpEmpty 灰色短条
  - 「+ 录入今日体重」全宽按钮 → push `/(main)/weight-entry`
  - 「历史」列表：倒序，最多 30 条，每条左侧缩略图（无照片用 hpEmpty 占位）+ 日期 + kg

**Mascot 文案**：体重模块自己一组 4 句备选（按 HP band），写在 `weight-entry.tsx` 内的 `WEIGHT_LINES` 常量，**不动** `dialogues.ts` 类型扩散影响。LLM 接通时会用 `generateMascotLine({ recentAction: 'meal_done' })` 复用积极行为语义（关闭时本地池兜底）

**HP +0.5 临时实现**：`weight-entry.onConfirm` 通过 `__dev_setHp(before + 0.5)` 给体重打卡加 0.5 HP。Hack — 见 v0.4 TODO 里的 `markWeightLogged` action

### 留给 v0.4 的 TODO

- [ ] **OCR 识别秤面数字**（PRD §5.4 留口子）：`weight-entry` 拍完照后自动填 `kgInput`。实现选项：iOS `Vision.framework`（要 native 模块）/ 云端 OCR API / Google MLKit
- [ ] **真折线图**（PRD §4.2 / §5.5 每周报表）：装 `react-native-chart-kit` 或 `victory-native`，30 / 90 天切换，替换当前柱状条
- [ ] **每日称重 21:00 daily-check 惩罚**（PRD §4.2 写明"未上传 → HP -1"）：`expo-notifications` 加一个 21:00 的 silent 调度，触发时检查 `weightHistory` 当日是否有记录，没有则 `markMealMissed` 等价的 HP -1。需要 store 加 `markWeightMissed`
- [ ] **`markWeightLogged` 专用 action**：当前用 `__dev_setHp(before + 0.5)` 是 hack，正式做应该独立 action（语义清晰、便于 stage 切换时改 +0.5 / +1）
- [ ] **饱腹度评分**（PRD §4.2 / §5.3）：餐次拍完照后加 0–10 滑块，≥7 才算"吃饱" HP +0.5。这是 stage 2 完整闭环的另一半，比体重还更紧
- [ ] **每周报表**（PRD §5.5）：HP 曲线 / 吃饱率 / 体重折线 / 按时率，机器人"小结"口吻呈现

---

## Bundle ID 变更（2026-04-29）

iOS 真机 build 报 `Failed Registering Bundle Identifier — "com.mealmate.app" cannot be registered to your development team because it is not available`：太通用被别人占了。

改为 **`com.xinray.mealmate`**（基于 GitHub 用户名 Xin-Ray，足够唯一）。Android `package` 同步对齐避免后续踩坑。

替换的位置：
- `app/app.json`：`expo.ios.bundleIdentifier` + `expo.android.package`
- `app/ios/mealmate/Info.plist`：`CFBundleURLSchemes`（OAuth deeplink 用，跟 bundleId 保持一致）
- `app/ios/mealmate.xcodeproj/project.pbxproj`：Debug + Release 两个 build configuration 的 `PRODUCT_BUNDLE_IDENTIFIER`

不跑 `npx expo prebuild --clean`（会清掉 ios/ 重新生成，连带 Pods 状态全丢）—— 直接 sed 替换更稳。

`/ios` 在 .gitignore 里，commit 只带上 `app.json` 的改动；其他人 clone 后跑 `npx expo prebuild` 会从 app.json 读新 bundleId 自动生成正确的 native 工程。

xin 在 Xcode 里要做的：
1. 选 mealmate target → Signing & Capabilities → Team 重新选（之前选过的话也要再选一次让 Xcode 触发 provisioning profile 拉取）
2. 等 Xcode 自动 register 新 bundleId 到 Apple Developer 后台并拉新 profile
3. 重新 build 真机

**未来上 App Store 时**：如果想换更好看的 bundleId（如 `app.mealmate.ios`），先去 Apple Developer 后台 Certificates / Identifiers 那边手动注册占住，再回 app.json 改一遍。
