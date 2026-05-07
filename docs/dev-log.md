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

---

## v0.4 实施 #2：Bug 修复 batch（2026-05-01）

### 修了什么

- **Onboarding 删 ChatGPT 步骤**：`app/onboarding/chatgpt.tsx` 文件删除（不是 deprecate，直接删干净）。流程从 `eating(1/4) → schedule(2/4) → name(3/4) → chatgpt(4/4)` 简化为 `eating(1/3) → schedule(2/3) → name(3/3)`，name 屏「下一步」直接 `finishOnboarding() + replace('/(main)/home')`。三屏的步骤标签 `第 X / 4 步` → `第 X / 3 步`。
- **store 删 `chatGPTLinked` 字段 + `setChatGPTLinked` action**：State / Actions / initialState / setter 实现 4 处全清。zustand persist 老用户的旧字段会被忽略，向后兼容
- **settings.tsx 删「ChatGPT 链接」整块 UI**：那块只 toggle 一个 mock 布尔，无实际功能，v0.5 重新做时按 §11.J 改"Google Gemini API key 录入屏"
- **home.tsx 删「查看 Stage 2 ▸」临时入口按钮**：之前是 stage2 死循环修复时加的临时入口，v0.4 新 IA 下 stage2 内容拆到首页 + 统计页，按钮失去意义

### 已知未修（留给后续）

- **dev panel 切 stage 2 后首页视觉不变**（xin 反馈）：当前切 stage 2 只影响 mascot 形象 + persistence，首页主体仍是 stage 1 视觉。**§11.K 第 3 项（Stage 2 主页重做）实施时天然解决**。本轮不动

---

## v0.4 实施 #3：Stage 2 主页重做（2026-05-01）

### 改动结构

`home.tsx` 简化为分发器（5 行）：

```tsx
return currentStage === 2 ? <HomeStage2 /> : <HomeStage1 />;
```

- `src/components/home/HomeStage1.tsx` — v0.3 主页主体抽出（视觉保持，第 4 项 token 化）
- `src/components/home/HomeStage2.tsx` — 新建，按 §11.B 实现
- `src/components/home/HpHearts.tsx` — 10 颗心横排
- `src/theme/hp.ts` — v0.4 0–100 阈值 + 5 band + 缩放函数
- `src/theme/tokens.ts` — 加 `brand.greenDark` (#3d683f) / `brand.greenSoft` (#8FAE75)

### 三个技术决策（自行拍板，dev-log 留痕）

#### 1. HP scale 0–15 vs 0–100 不一致 — 走显示缩放路线（C 路）
store 当前 HP 仍是 0–15（v0.3 旧规则未 migrate）。但 PRD §11.B 用 0–100 阈值（满血≥80 / 平稳 60-79 / 欠佳 40-59 / 虚弱 20-39 / 濒临<20）。
本项 stage 2 主页内部用 `hpToDisplay(hp) = round(hp / 15 * 100)` 缩放显示，按 0–100 算 band。

**TODO §11.K 第 7 项（餐后 +5/-15）**：把 store HP scale 真正 migrate 到 0–100，届时移除 `hpToDisplay` 缩放，所有阈值直接用 raw HP。stage 1 的 `hpBandFromValue` (0–15 → 4 band) 同时迁移。

#### 2. 今日记录区先空态
`dialogueHistory: string[]` 当前是 ID 数组，无 timestamp / hpDelta / slot 关联。§11.B step 4 描述的卡片（时间 / 文案 / HP delta 标签 / 食物图缩略）所需字段不在当前 shape。

本项实现完整 UI 骨架 + 空态分支（"今天还没有记录"）；卡片渲染推到 §11.K 第 7 项数据进来时。**不动 dialogueHistory shape**——第 7 项决定升级它还是新建字段。

#### 3. expo-router typed routes 类型 stale
`.expo/types/router.d.ts` 是 14 行 stub，未含新路由 records / stats / weight-entry。Metro 重启时 expo-router 会自动 regen，但本地 tsc 报错。HomeStage2 的 `router.push("/(main)/records" as never)` 用 `as never` 绕开。Metro 跑过一次后可以移除 cast。

### Stage 2 主页元素（§11.B 全部落地）

| 元素 | 状态 |
|---|---|
| 状态大标题（5 band 切换） + Mascot（stage=2） | ✅ |
| HP 心形条（10 颗 ❤️/🤍 + X/100 数字） | ✅（按比例填充） |
| 当前体重模块（最近 / diff / 时间 / ⚖️ icon） | ✅ 点击跳 weight-entry（已实现屏） |
| 下一餐倒计时（窗内：到窗末 / 窗外：到下一餐窗起 / 跨日 → 明天早餐） | ✅ 每秒 tick |
| "去拍照" CTA + alreadyDone 状态切换 | ✅ |
| 今日记录区 + "查看更多 ›" → /records | ✅（空态） |

### Stage 1 切 Stage 2 切换体验

dev panel 切 Stage 2 → 首页立刻切到全新 stage 2 视觉（条件渲染就在 home.tsx 顶部）。v0.4 #2 留下的"切 stage 2 视觉问题"本项**已经解决**。

---

## v0.4 实施 #4 / Commit A：HP 0–15 → 0–100 标度迁移 + 4 band（2026-05-01）

### 改了什么

**store v1 → v2**：
- `HP_MAX = 100`、`HP_MEAL_PHOTO_GAIN = 5`、`HP_MEAL_MISSED_LOSS = 10` 常量
- `clampHp` 上限 15 → 100
- `markMealDone`：`+0.5` → `+5`；advanceStage 阈值 `15` → `100`
- `markMealMissed`：`-1` / `-0.5` (gentle) → `-10` / `-5` (gentle)
- `initialState.hp`：`8` → `67`（约对应老 0–15 标度的 10，PRD §四 阶段一初始）
- `persist` 加 `version: 2` + `migrate(state, version)`：v1 数据 `hp` 字段 `× (100/15)` 取整 clamp [0, 100]，老用户数据安全升级

**`src/theme/hp.ts` 重写**（删 v0.3 缩放 hack）：
- 删 `HP_MAX_INTERNAL` / `HP_MAX_DISPLAY` / `hpToDisplay` / `hpBandFromDisplay` / `hpBandFromStoreHp` / `HpBandV4` / `HP_BAND_TITLE` / `HP_BAND_SUBTITLE`
- 新建 `HP_BANDS: readonly HpBandSpec[]`，4 档单一真源（full / stable / low / critical），含 `min/max/key/title/subtitle/hint`
- `getHpBand(hp)`：线性扫描返回当前 band。max 是开区间（50 落在 stable），100 是闭区间
- `HP_LOW_THRESHOLD = 30`（critical band 上限，给后续 missed-check 用）
- `hpHeartsFill(hp)` 简化：直接 hp/10 不再缩放
- tokens.ts 的 `HP_LOW_THRESHOLD` 删除（避免双源真相）

**`dialogues.ts`**：
- `hpBandFromValue` 阈值 0–15 → 0–100（旧 4 band 名 weak/hungry/recovering/happy 保留，对应 critical/low/stable/full）。dialogues 池 24 条不动

**调用点更新**（不破已有屏）：
- HomeStage2：`hpBandFromStoreHp` → `getHpBand`，读 `band.title/subtitle/hint`
- HpHearts：`hpToDisplay(hp)` → 直接 `hp` 显示 `X/100`
- HpBar / Mascot / HomeStage1 / settings / _layout / photo / weight-entry：透过 `hpBandFromValue` 接 0–100 阈值，无代码改动
- settings 开发者面板 HP 5 档 `[0,4,8,12,15]` → `[0,25,50,75,100]`，label `当前 N/15` → `当前 N/100`

### PRD §11 同步修订

- §11.B 状态大标题：5 档 → **4 档**，加完整阈值/文案/mascot 资源映射表
- §11.F.2 错过餐 `-15` → `-10`
- §11.G "状态不好"：dim 变体页方案 → **`critical` band 自然渲染**（不再单独页，色板共享）
- §11.I 默认值表：HP 标度 / +5 / -10 / 4 band 阈值 / critical 自然渲染

### 验

`tsc --noEmit` 0 错。Metro reload 后老用户首次启动会触发 v1→v2 migrate（hp×6.67 一次性），后续读写都是 0–100；新用户从 `initialState.hp=67` 起步。

---

## v0.4 资源：HP band mascot + missed/reminder（2026-05-07）

`app/assets/mascot/` 下 6 张 PNG，来自 Figma export：

| 文件 | Figma node-id | 用途 | md5 (前 8) | 大小 |
|---|---|---|---|---|
| `full.png` | 5:45 | 血量 8–10 颗心（HP ≥ 80） | `baaa78ed` | 225 KB |
| `stable.png` | 5:14 | 血量 5–7 颗心（HP 50–80） | `b980dc9a` | 201 KB |
| `low.png` | 1:305 | 血量 2–4 颗心（HP 30–50） | `30e50001` | 209 KB |
| `critical.png` | 1:332 | 血量 1 颗心（HP < 30） | `c04b872f` | 273 KB |
| `missed.png` | （早前 Figma export，独立资源） | MissedMealModal 用 | `a1167e34` | 52 KB |
| `reminder.png` | （早前 Figma export，独立资源） | MealReminderModal 用 | `0004dca8` | 33 KB |

历史曲折：第一次拿到 4 张 band mascot ID 都返回同一张占位 PNG（md5 一致）；xin 在 Figma 重新合并/拆分后给了 4 个新 node-id（5:45 / 5:14 / 1:305 / 1:332），重下 md5 全不同 ✅。

**未接入**：HomeStage2 仍用 `<Mascot stage={2}>` emoji 占位。HP 阈值表（hp.ts 的 `HP_BANDS`）也未按新心数划分（xin 提到 8-10/5-7/2-4/1，与 v0.4 §11.B 当前 ≥80 / 50-80 / 30-50 / <30 略有差别），等 xin 给完整文案 + 阈值后整合接入。

---

## v0.4 实施 #5 / Commit B：HomeStage2 接真 mascot + 4 band 文案最终化（2026-05-07）

### HP_BANDS 最终阈值（xin 拍板）

| band | HP（闭区间） | 大标题 | mascot |
|---|---|---|---|
| full | 80–100 | 精力十足 | full.png |
| stable | 50–79 | 轻微疲惫 | stable.png |
| low | 20–49 | 残血状态 | low.png |
| critical | 0–19 | 濒临耗尽 | critical.png |

变化点（vs v0.4 实施 #4 暂定）：
- low 下限 30 → **20**
- critical 上限 <30 → **0–19**
- full title 「满血状态」 → 「精力十足」
- 区间从开/闭混合统一改为**闭区间**（max=100/79/49/19，无 gap）
- `HP_BANDS` 每条加 `mascot: ImageSourcePropType` 字段（require Figma export PNG）

### HomeStage2 改动

- `<Mascot hp={hp} stage={2} size={110} />`（emoji 占位）→ `<Image source={band.mascot} style={{width:130,height:130}} resizeMode="contain" />`
- mascot 用 `getHpBand(hp).mascot` 实时切换（dev panel 切 HP 立刻看效果）
- Mascot 组件本身保留（HomeStage1 还在用，第 4 项 token 化时再处理）

### HP_LOW_THRESHOLD 现状

保留在 `hp.ts` 仍为 30，与 4 band 的 critical 上限 (19) 不一致。语义独立：HP_LOW_THRESHOLD 给后续 missed-check / 提醒触发等更宽阈值场景；UI 显示按 4 band 走。§11.K 第 7 项实施 missed-check 时再 review 是否对齐 20。

---

## v0.4 实施 #6 / Commit C：组件库 + (modal) group + components.md（2026-05-07）

### 新建 `app/src/components/ui/`

9 个组件：

**基础**：
- `Card` — 通用卡片包装（bg.card / 16 圆角 / border 1px），children + 可选 onPress
- `PrimaryButton` — 主 CTA（brand.green bg / 白字 / disabled 降饱和）
- `HpHearts` — 10 颗心 + X/100（从 home/ 移到 ui/）

**业务模块（抽自 HomeStage2）**：
- `StatusTitle` — 状态大标题区（含 mascot Image），输入 hp 自动渲染 4 band
- `WeightCard` — 体重模块（最近一次 + diff + 时间 + ⚖️ icon）
- `MealCountdownCard` — 倒计时卡（内部 tick + getMealWindowState + PrimaryButton）
- `RecordCard` — 单条记录（ts / text / hpDelta / photoUri 缩略图）

**Modal**：
- `MealReminderModal` — 餐次到点提醒（reminder.png mascot + 去拍照 / 稍后再说）
- `MissedMealModal` — 错过餐次提示（missed.png mascot + 血量-10 badge + 我知道了）

### HomeStage2 重写为组装版

330 行 → ~85 行。所有 5 段 UI 都用新组件。`<Mascot stage={2}>` emoji 引用被 StatusTitle 内嵌的真 mascot Image 替代。

### 新增 `app/(modal)/` route group

- `_layout.tsx`：`<Stack screenOptions={{ presentation: 'modal' }}>`
- `meal-reminder.tsx`：route 包装 MealReminderModal
- `meal-missed.tsx`：route 包装 MissedMealModal
- root `_layout.tsx` 加 `<Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />`

业务触发（meal window 监听 → 自动 push reminder/missed modal）留 §11.K 第 7 项。当前阶段开发者可手动 `router.push({ pathname: '/(modal)/meal-reminder', params: { slot: 'breakfast' } })` 预览。

### 新增 `docs/components.md`

集中所有可复用组件的 props 表 + Figma 参考 + 用在哪些屏。**强制规则**：每加新组件必须同步更新此文档（否则仓库下一个接手的人找不到组件）。

### 删除

- `app/src/components/home/HpHearts.tsx`（移到 ui/）

### 仍待做

- `Mascot.tsx` / `WeekStrip.tsx` / `HpBar.tsx` / `MealCard.tsx` 仍在 v0.3 老位置（HomeStage1 还在用），第 4 项 stage 1 主页 token 化时一并 review 是否迁 ui/

---

## v0.4 实施 #7 / §11.K 第 4 项：Stage 1 主页 token 化（2026-05-07）

### HomeStage1 重写

旧（v0.3 风格）：硬编码颜色 / 老 `<Mascot>` emoji / 老 `<HpBar>` / `pickDialogue` 选 mock greeting / 三餐 `<MealCard>` 列表 / 顶部 stage label + name + 设置按钮。

新（v0.4 §11.C）：与 HomeStage2 共用 `ui/` 组件库。

| 段 | 用什么 |
|---|---|
| 1. 周视图 7 天 | `<WeekStrip>`（保留 v0.3，stage 1 特有） |
| 2. 状态大标题 + Mascot | `<StatusTitle hp={hp} stage={1} />` |
| 3. HP 心形条 | `<Card>` + `<HpHearts hp={hp} />` |
| 4. 倒计时卡 | `<MealCountdownCard>` |
| 5. 今日记录 | `<RecordCard>`（数据接 §11.K 第 7 项；当前空态） |

行数：~132 → ~85。

删除：v0.3 的 LLM call / dialogueHistory mock greeting 拉取 / disappearWarning 提示 / `useEffect` LLM AbortController / 三餐 MealCard 列表 / header stage label 区。

### `getHpBand(hp, stage)` 加 stage 参数

`src/theme/hp.ts`：
- 新建 `STAGE1_BAND_COPY: Record<HpBandKey, { title, subtitle, hint }>`，4 band 鼓励调性文案（⏳ 待 xin 复核，由 task 拟）
- `STAGE1_MASCOT = require('full.png')`（4 band 都用满血形象兜底，等 stage 1 专属 mascot 画好再换）
- `getHpBand(hp, stage = 2)`：stage=1 时把 base band 的 title/subtitle/hint/mascot 用 stage 1 那套覆盖；stage=2 不变（向后兼容）

### `StatusTitle` 加 stage prop

`Props: { hp: number; stage?: 1 \| 2 }`，默认 2。HomeStage1 传 `stage={1}`，HomeStage2 不传走默认。

### 孤儿组件

`HpBar.tsx` / `MealCard.tsx` 现在没有调用方。**本 commit 不删**（避免 diff 膨胀）— 第 10 项收尾时一并清掉。

`Mascot.tsx` 仍被 `onboarding/name.tsx` + `(main)/stage2.tsx` 使用，保留。

### dev panel 切 Stage 1 ↔ 2

切 stage 时首页**视觉骨架完全一致**，差异只在：状态文案调性、是否显示体重、是否显示周视图。组件复用率显著提高。

---

## v0.4 实施 #8 / §11.K 第 5 项 Commit 1：records 数据层（2026-05-07）

### types

- `FullnessScore = 3 | 5 | 8`
- `FullnessRecord = { id, mealSlot, date, score, recordedAt }`

### store v2 → v3

- 加 `fullnessHistory: FullnessRecord[]`
- action `addFullnessRecord({ mealSlot, score })`：内部用 todayKey + Date.now() + 同 mealSlot+date 覆盖；上限 270 条（90 天 × 3 餐）
- `__dev_clearFullnessHistory()` 给 dev panel
- persist `version: 3` migrate：v2→v3 默认 `fullnessHistory=[]` 老用户兼容

### feed selector

`src/data/feed.ts` — `buildTodayFeed({ todayKey, todayMeals, schedules, fullnessHistory })` 返回 `FeedItem[]`，三种 kind：
- `meal`：从 `todayMeals` 派生（done/missed），ts 用 `schedules[slot]` 转今天近似
- `fullness`：从 `fullnessHistory` 当日过滤，ts=recordedAt
- `dialogue`：留接口，shape 升级前不返回数据（第 7 项接）

### dev panel

加「清空饱腹度评分」按钮。

### 仍待第 7 项

- dialogueHistory shape（加 ts / hpDelta / photoUri）→ feed dialogue kind 真渲染
- 餐后 photo 流走完后弹饱腹度评分（次入口）
- 饱腹度的 mealSlot 精确关联当前/最近过期的 mealWindow（本项默认 lunch）

---

## v0.4 实施 #9 / §11.K 第 5 项 Commit 2：records 页 UI（2026-05-07）

### 新组件

- `EmptyRecord.tsx` — 空态卡（HomeStage1/2/records 共用，按之前留账 4 抽出）
- `FullnessRatingPicker.tsx` — 3 选 1 圆角浅绿卡片（按 Figma 1:171）；选中态加深 `brand.green/20%`

### `RecordCard` 重写为 polymorphic

旧 props：`{ ts?, text, hpDelta?, photoUri? }` → 新 props：`{ item: FeedItem }`

按 kind dispatch：
- `meal`：emoji icon (🍽️/💤) + 时间 + "{slot} 已完成 ✓ / 错过了" + HP delta badge（+5 / -10 占位，真实数据待第 7 项）
- `fullness`：emoji（按 score 切😞/😐/😊）+ 时间 + "今日饱腹度：X/10 · {slot}"
- `dialogue`：返回 null（shape 升级前不渲染）

### `records.tsx` 完整实现

- 顶部 "我今天吃饭的饱腹感" + `FullnessRatingPicker`，默认 mealSlot=lunch（精确关联 mealWindow 留第 7 项）
- 选中后调 `addFullnessRecord({ mealSlot: 'lunch', score })`，同 mealSlot+date 覆盖（已存在则改选）
- 下方 "今日记录" feed：用 `buildTodayFeed` selector → 倒序 `<RecordCard item={...}/>` 列表
- 无 feed 时显示 `<EmptyRecord />`

### HomeStage1 / HomeStage2 用 EmptyRecord 替换内嵌空态

两处重复的 12 行内嵌空态块 → 单行 `<EmptyRecord />`。

### simulator 验

切到"记录"tab 应该看到：
- 3 个饱腹度选项（点击切换、改选覆盖）
- feed 默认空态
- 用 dev panel 切 HP / "立即触发"推送 → 走 photo flow 完成 → mealHistory 更新
- 切回记录 tab → feed 显示一条 meal 卡（"早餐 已完成 ✓ +5"）
- 选饱腹度后 feed 多一条 fullness 卡（"今日饱腹度：5/10 · 午餐"）
- dev panel 加的「清空饱腹度评分」按钮可重置

### 仍待第 7 项

- dialogueHistory shape 升级 → feed dialogue kind 真渲染
- photo result phase 完成后弹饱腹度评分（次入口）
- 饱腹度精确关联 mealWindow（本项默认 lunch）
- meal kind HP delta 用真实记录而非占位 +5/-10

---

## v0.4 实施 #10 / §11.K 第 6 项：统计页 — 爱心 + 体重趋势（2026-05-07）

### 引入新 native 依赖

`react-native-svg@15.12.1`（`npx expo install` 选 SDK 54 兼容版）。

⚠️ **xin 必须重 build**（新 native module 不能仅 reload）：
```
cd /Users/xiangxin/Documents/mealmate/app/ios
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install
cd .. && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo run:ios
```

### 新组件 / selector

- `src/components/ui/TrendChart.tsx` — 通用趋势图，接 `TrendPoint[]` + `yAxis: number[]`，用 `<Svg> <G> <Path> <Circle> <Line> <SvgText>` 渲染
- `src/store/selectors/stats.ts`：
  - `STAGE_KEYS = [1, 3, 5, 8, 10]` + `STAGE_BAND_LABEL` 映射
  - `selectStageHpProgress({ hp, currentStage }) → StageHpPoint[]` — 仅 currentStage 对应 stage 有数据，其他 null
  - `selectStageWeightProgress({ weightHistory, currentStage }) → StageWeightPoint[]`
  - `autoYAxis(values, targetTicks=5)` — 体重 Y 轴自动 min-max 缩放

### 重写 `stats.tsx`

- 页头 "📊 趋势图表" + 副标 + 右上 disabled "全部阶段" pill
- `<TrendChart>` × 2：爱心（Y 0-12）+ 体重（Y autoYAxis）
- 底部小贴士标 v0.5 stage history 持久化

### 稀疏降级实测

- v0.4 currentStage===1 用户：爱心图 1 个实心圆（X=1 那点）+ 4 空心圆 + "再坚持几天" 提示；体重图 5 个空心圆（stage 1 不录体重）
- currentStage===2 用户：爱心图 2 实心圆（X=1 满 10 颗 + X=3 当前 hp/10）连线；体重图 1 实心圆（X=3）+ "再坚持几天"

### 仍待 v0.5

- 跨 stage history 持久化（每次 advanceStage 记快照）
- "近 5 个阶段" 切换器
- 真平滑曲线（quadratic bezier 或 catmull-rom 插值），当前是直线段

---

## v0.4 实施 #11 / §11.K 第 7 项 Commit 1：dialogueHistory + mealHistory shape 升级（2026-05-07）

### types

- `MealRecord` — `{ id, date, mealSlot, status: 'done'|'missed', ts, hpDelta, photoUri? }`
- `DialogueKind` — `'meal_done'|'meal_missed'|'encourage'|'remind'|'mock'`
- `DialogueRecord` — `{ id, ts, body, kind, hpDelta?, mealSlot?, photoUri? }`

### store v3 → v4

- `state.dialogueHistory: string[]` → `DialogueRecord[]`，倒序，最多 50 条
- `state.mealRecords: MealRecord[]` 新增（与 todayMeals 并存：todayMeals 给周视图用，mealRecords 给 feed 用）
- `markMealDone(slot, options?: { photoUri? })` 升级：自动 push 一条 MealRecord
- `markMealMissed(slot)` 同上（内部还会被 missed-scan 调，§11.K 第 7-3 项）
- `pushDialogue(input: Omit<DialogueRecord, 'id'|'ts'>)` 接结构化对象
- v3→v4 migrate：老 `dialogueHistory: string[]` 检测到首元素是 string 就丢成 `[]`（v0.4 不向后保留 dialogue 历史，可接受），加 `mealRecords: []`
- 新加 `__dev_clearMealRecords` + `__dev_clearDialogueHistory`，settings dev panel 两个按钮

### feed.ts

- 输入：`{ todayKey, fullnessHistory, mealRecords, dialogueHistory }`（不再依赖 todayMeals + schedules）
- meal kind：从 `mealRecords.filter(r => r.date === todayKey)` 派生，ts 精确
- dialogue kind：实装！按 `dateKeyOf(record.ts) === todayKey` 过滤，渲染含 photoUri / hpDelta / body

### RecordCard

- dialogue kind 实装：左侧 photo / 🤖 缩略 + 时间 + body + hpDelta badge（如有）
- meal kind 改用 `record.hpDelta` 而非硬编 +5/-10

### photo.tsx 兼容更新

- `markMealDone(realSlot, { photoUri })` 传 photoUri 进 store
- `pushDialogue({ kind: 'mock', body, mealSlot })`（结构化对象）
- pickDialogue 的 excludeIds 暂传 `dialogueHistory.map(d=>d.id)`，但新 record.id 与池 id 不重合 → dedup 失效（不影响用户感知，v0.5 加 sourceId 字段恢复）

### records.tsx

- `useStore` 选 `mealRecords` + `dialogueHistory`，传给 buildTodayFeed
- 不再读 todayMeals/schedules 给 feed（todayMeals 只剩周视图用）

### 仍待 §11.K 第 7-2 / 7-3

- photo result phase 接 FullnessRatingPicker
- 通过餐双消息（"太棒了..." + 鼓励）
- missed-scan 自动扣分 + 双消息 + missed modal

---

## v0.4 实施 #12 / §11.K 第 7 项 Commit 2：photo flow 接 fullness + 双消息（2026-05-07）

PRD §11.F.1 落地。photo.tsx onConfirm 改造：

- `markMealDone(slot, { photoUri })` → store 自动落 `MealRecord` 含 `hpDelta=+5`
- push **两条** dialogue（feed 倒序展示）：
  - `kind: 'meal_done'` body: 随机选自 `DONE_LINE_BY_SLOT[slot]`（每 slot 3 候选），带 `hpDelta=5` + `photoUri`，feed 卡片显示「血量+5」绿色 badge
  - `kind: 'encourage'` body: 随机选自 `ENCOURAGE_LINES`（5 候选），不带 hpDelta（无 badge，纯陪伴话）

result phase UI 升级：
- "HP +0.5" → "血量 +5"（值用 `HP_MEAL_PHOTO_GAIN` 常量，不硬编）
- Mascot 卡显示**两条**消息（doneLine 主 + encourageLine 副）
- 下方挂 `<FullnessRatingPicker>`，选了即调 `addFullnessRecord(slot, score)`
- 完成按钮文字按是否选了切：「跳过，先回首页」/「完成」
- 整屏改为 `<ScrollView>`（多了 picker 内容，避免溢出）

LLM 调用从 result phase 临时移除：
- v0.4 §11.H 全程 LLM_ENABLED=false，调了也只走 fallback；本项简化为静态文案（DONE_LINE_BY_SLOT + ENCOURAGE_LINES），减少视觉抖动（之前 mock → LLM 替换会闪一次）
- v0.5 服务器代理上线后再接回，本 commit dev-log 记 TODO

仍待 §11.K 第 7-3：
- 错过餐 silent 调度 → app 激活时 missed-scan → markMealMissed + 双消息 + missed modal

---

## v0.4 实施 #13 / §11.K 第 7 项 Commit 3：missed-scan + 双消息 + missed modal（2026-05-07）

PRD §11.F.2 落地。

### `src/services/missedScan.ts`

- `detectMissedSlots(schedules, todayMeals, now)` — 返回今日 status === 'pending' 且已过窗末（`schedules[slot] + 90min`）的 slot 列表
- `runMissedScan()` — 顶层入口：
  1. `state.rollDayIfNeeded()` 防跨日漏扫
  2. `detectMissedSlots(...)`
  3. 每个 missed slot：`markMealMissed(slot)` → push 两条 dialogue
     - `kind: 'meal_missed'` body 随机选自 `MISSED_LINE_BY_SLOT[slot]`（每 slot 3 候选），带 `hpDelta=-10`（gentle -5）
     - `kind: 'remind'` body 随机选自 `REMIND_BY_STAGE[currentStage]`（stage 1/2 各 3 候选），不带 hpDelta
  4. 返回新 missed slot 数组（用于 modal 触发判断）

### `_layout.tsx` 接入

- `import { AppState } from "react-native"`
- 新增 `useEffect` AppState listener：
  - 首次启动延迟 0ms 跑（等 router 挂载）
  - `AppState.change` → `'active'` → 跑
  - `runMissedScan()` 返回非空 → `router.push('/(modal)/meal-missed', { slot: newMissed[0] })`（多 slot 只弹第一个，其它已扣分进 feed）

### iOS 后台限制

iOS 后台不能可靠跑 JS，silent 通知触发后台 task 在 expo-notifications 严苛受限。v0.4 退化为 **app 激活时扫描**：用户白天没开 app 错过餐次也会扣分，只是延迟到下次开 app 才算到 feed。这是 chess 类 app 标准玩法，可接受。

silent 调度精确触发留 v0.5（结合服务端推送）。

### `v0.4-test-plan.md` 更新

#6 modal 章节："业务自动触发已落地"，加测试步骤：把时间改成 91 分钟前 → 杀 app 重开 → 自动扣分 + 弹 modal。

### 完成 §11.K 第 7 项三大目标

| 目标 | 状态 |
|---|---|
| dialogueHistory shape 升级 | ✅ Commit 1 |
| photo flow 接 fullness + 通过餐双消息 + +5 | ✅ Commit 2 |
| missed-scan 自动扣 -10 + 双消息 + missed modal 触发 | ✅ Commit 3 |

---

## v0.4 实施 #14 / §11.K 第 9 项：「我的」页 token 化（2026-05-07）

### 改造

settings.tsx 全屏重写：
- 整页 bg 用 `colors.bg.page`
- 所有卡片块用 `<Card>`（v0.4 抽好的 ui/ 组件）— 推送时间 / 名字 / 偏好 / 关于 / 开发者面板各自一卡
- 同一卡内多行用 `<Divider>` 内联组件分隔（vertical line `colors.border.card`，宽度抵消 Card 内 px 让分隔贴边）
- Section 标题统一用 `<SectionLabel>` 内联组件（`colors.ink.sub`，12pt，上下间距统一）
- 顶部页面标题改成"我的"（24pt semibold `colors.ink.primary`），不再是"设置"也不再带"返回"按钮（底 tab 已经导航）
- HP 5 档 / Stage 切换的高亮用 `colors.brand.green`（不再是 `accent` 橙色，跟 stage 2 主页 CTA 同源）
- 偏好开关副标更新："温柔模式"提示文字改成"错过一餐时只扣 5 HP（默认 -10）"，对齐 v0.4 §11.F.2 的新数值
- "立即触发餐次提醒" 3 个按钮 + 5 个清空动作合并到一个 Card 内用 Divider 分项（少了 5 个独立 Card 视觉碎片）

### 保留全部功能

- 推送时间编辑（DateTimePicker）
- 机器人名字
- 温柔模式 / 称重跳过照片
- 关于（隐私 / 求助）→ Alert 占位
- 危险区 → 删除账号
- 开发者面板（仅 `__DEV__`）：HP 5 档 / Stage 切换 / 重置今日 / 重置 onboarding / 清空体重 / 清空饱腹 / 清空餐次 / 清空对话 / 触发推送

### ⏳ 待 xin 复核

- 「我的」页 Figma frame 链接尚未给。v0.4 仅做 token 化，未做像素级对齐 Figma。
  v0.5 收到 Figma frame 后再精对齐（间距 / 字号 / icon）。

---

## v0.4 实施 #15 / §11.K 第 10 项：v0.4 收尾大扫除（2026-05-07）

### 删除

- `app/(main)/stage2.tsx` — v0.3 占位屏，v0.4 内容并入 HomeStage2，路径不再被引用
- `app/src/components/HpBar.tsx` — v0.3 老进度条，HomeStage1 v0.4 #4 改用 HpHearts 后无引用
- `app/src/components/MealCard.tsx` — v0.3 老餐次卡，HomeStage1 v0.4 #4 改用 MealCountdownCard 后无引用

孤儿确认：`grep -rn 'from.*"@src/components/{HpBar,MealCard}"'` 返回空。

### 移动到 (modal) group

- `app/(main)/photo.tsx` → `app/(modal)/photo.tsx`
- `app/(main)/weight-entry.tsx` → `app/(modal)/weight-entry.tsx`

`(modal)/_layout.tsx` 早已配 `presentation: 'modal'`，迁移后 photo / weight-entry 自动**恢复"从下推上来"的 modal 视觉**（v0.4 §11.K 第 1 项基建临时丢失的）。

### 路由路径迁移（5 处）

| 调用方 | 旧 | 新 |
|---|---|---|
| `app/_layout.tsx` notifications listener | `/(main)/photo` | `/(modal)/photo` |
| `app/(modal)/meal-reminder.tsx` | `/(main)/photo` | `/(modal)/photo` |
| `src/components/home/HomeStage1.tsx` onCaptureMeal | `/(main)/photo` | `/(modal)/photo` |
| `src/components/home/HomeStage2.tsx` onCaptureMeal | `/(main)/photo` | `/(modal)/photo` |
| `src/components/home/HomeStage2.tsx` 体重模块 onPress | `/(main)/weight-entry` | `/(modal)/weight-entry` |

### `(main)/_layout.tsx` 简化

不再需要 hidden Tabs.Screen for photo / stage2 / weight-entry — 这些路径都不在 (main) 下了。layout 现在只剩 4 个 visible tabs（home / records / stats / settings），干净。

### Mascot.tsx 保留

仍被 `app/onboarding/name.tsx` 用（onboarding 第 3/3 步给机器人取名时展示头像）。其他用处都已迁到 `<StatusTitle>` + 真 mascot Image。`isStage2` prop 在 stage 2 被移除引用后可考虑简化，但本项不动（onboarding 仍用 emoji 占位）。

### docs 同步

- `docs/components.md` 删除 HpBar / MealCard 条目；Mascot 备注更新为"onboarding/name 用"
- `docs/v0.4-test-plan.md` 顶部加"v0.4 全部 10 项已收尾"；modal 测试章节补 photo / weight-entry 的 console 触发命令

### v0.4 完结统计

| 项 | commit | 备注 |
|---|---|---|
| #1 基建 tokens + 4-tab | `a8779d1` | |
| #2 Onboarding 删 ChatGPT + home 删 stage2 入口 | `3d97e04` | |
| #3 Stage 2 主页重做 | `f68e79d` | |
| #4 Stage 1 token 化 + 倒计时 + 今日记录 | `bafecf6` | |
| #5 记录页 + 饱腹度 | `e33251e` + `ee32fa3` | |
| #6 统计页（svg） | `03f002b` | |
| #7 餐后消息 + missed-scan | `2e6af9c` + `4da04b1` + `f6162b9` | |
| #8 critical band 自然渲染 | (随 #4 落地) | |
| #9 我的页 token 化 | `3b3e532` | |
| #10 收尾大扫除 | (本 commit) | |

外加：HP 标度 0-15→0-100（`7973745`） / 真 mascot 接入（`22c7638`） / 组件库抽出（`7834de0`） / mascot 资源入库（`b8279c8`） / docs 测试清单（`6d2785e`）

下一步：xin 重 build + 走 v0.4-test-plan 全套测试 → v0.5 大门（LLM worker 代理 / stage history 持久化 / 真平滑曲线 / Figma 像素对齐）

---

## v0.4 hotfix：HomeStage2 hero 区按 Figma 修正（2026-05-07）

### 现象（xin 反馈）

HomeStage2 视觉跟 Figma 完全错位：
- Figma 设计：顶部一整块大 hero 卡（524×461 PNG，背景 + mascot + 标题/副标 baked 在图里），下面**独立**一个心形条卡
- 之前实现：`<StatusTitle>` 把 title/subtitle 用 RN Text 渲染在左侧，**整张 Figma frame 当成 130×130 小缩略图塞在右上角**（成了"卡片套小卡片"）；心形条用红色 emoji ❤️/🤍

### 根因

之前下载的 4 张 mascot PNG 是 557×553，**含 HP 卡片在底部**（不是 mascot-only）。视觉上当成"图标"塞 StatusTitle 是误用。

### 修法

1. **重下 4 张 mascot-only PNG**（524×461，无 HP 卡片）：
   - `full.png` (Figma 5:46 ip 子组)、`stable.png` (5:15)、`low.png` (5:11) — curl 下载
   - `critical.png` — Figma 没单独 ip 子组，用 `sips --cropToHeightWidth 392 524` 把现有 critical.png（含 HP 卡）顶部 mascot 区裁出
   - 4 张 md5 全异 ✅，全合法 PNG。critical 比另 3 张矮（392 vs 461）—— hero card aspectRatio=524/461 + contain 模式自动留白吸收差异
2. **HomeStage2 hero 重写**：
   - 删 `<StatusTitle hp={hp} stage={2} />` 引用（不再渲染文字 + 小图）
   - 改成 hero card：`<View>` + `<Image source={band.mascot} style={{ width: '100%', aspectRatio: 524/461 }} resizeMode="contain" />`
   - 卡片样式：`bg.card` + `border.card` 1px + 30 圆角 + `overflow: hidden`
3. **`HpHearts` → `HpHeartsCard`**（重命名 + 升级）：
   - emoji ❤️/🤍 → react-native-svg `<Path>` 心形
   - 满心填充 `colors.brand.greenSoft` (#8FAE75)；空心 `#D8E0CA`
   - 右侧 X/100 18pt semibold `colors.brand.green`
   - 自带 `<Card>` 包装（HomeStage1/2 不再需要外层 Card）
4. **HomeStage1 同步用 `HpHeartsCard`**：删了之前内嵌的 "Apig 的体力" 头标题（`robotName` 也不再需要 selector，删 hook）；StatusTitle 在 HomeStage1 仍保留（左标题右小图布局这屏没变）

### docs

- `components.md`：HpHearts 条目 → HpHeartsCard，附 svg 心形说明；StatusTitle 备注"v0.4 hotfix 后 HomeStage2 不再用"

### ⏳ 待 xin 复核

- critical mascot 是裁出来的（524×392 vs 另 3 张 524×461），高度不一致；contain 模式吸收差异但视觉上 critical hero 显得矮一截。等 xin 在 Figma 给 critical 的 ip 子组（或者就接受当前留白）
- 心形 svg path 用经典 24×24 viewBox + 缩放到 20×18，可能跟 Figma 的心形 path 形状不完全一致（pixel-perfect 留 v0.5 精对齐）

---

## v0.4 hotfix #2：提醒卡生命周期（2026-05-07）

### 现象（xin 反馈）

之前 `<MealCountdownCard>` 永远显示，包括拍完照后还显示"已记录 ✓"占位（不对）。
错过餐没有专属"未完成卡 + 我知道了"流程。

### 修法

#### Store v4 → v5

- `MealRecord` 加 `acknowledged?: boolean`（仅 status='missed' 用）
- 新 action `acknowledgeMissedMeal(slot, date)` — 把 mealRecords 里匹配的 missed 记录标 acked
- persist v5 migrate noop（缺失字段自动 undefined）

#### selectors `src/store/selectors/reminder.ts`

- `selectActiveReminderSlot({ schedules, mealRecords, todayKey }, now?)` — 当前在某 slot 窗口（90min）内 + 今日未 done → 返回 `{ slot, windowEnd }`；否则 null
- `selectUnackMissedSlot({ mealRecords })` — 找最近一条 status='missed' 且未 ack → 返回 `{ slot, date }`；否则 null

#### 新组件

- `<MealReminderCard>` — 按 Figma 12:119（active 提醒卡）
- `<MealIncompleteCard>` — 按 Figma 10:116（未完成卡 + 我知道了）
- `<HomeMealStatusSlot>` — 容器，跑 selectors 决定 active / incomplete / null

#### HomeStage1 + HomeStage2

- 删 `<MealCountdownCard>` 引用 + 相关 `schedules` / `onCaptureMeal` 局部 state
- 用 `<HomeMealStatusSlot />` 替代

#### Modal 入口

- `(modal)/meal-missed.tsx` 内 "我知道了" 也调 `acknowledgeMissedMeal`，跟首页 incomplete 卡同步 ack 状态。modal 现作为通知点击的次入口。

#### MealCountdownCard 标 deprecated

文件保留 + 顶部加 `@deprecated` 注释。无引用，下次清理可删。

### 行为时序

```
窗口 [start, end] 内未 done    → MealReminderCard（倒计时）
窗口 [start, end] 内 done       → 隐藏（拍完照立刻消失）
窗口结束未 done + 未 ack         → MealIncompleteCard
窗口结束未 done + 已 ack         → 隐藏
```

missed-scan 触发的 markMealMissed 不影响 ack 状态（默认 false）—— 用户从 home 卡或 modal 点"我知道了"才标 ack。

---

## v0.4 hotfix #3：今日记录区与 records tab 同步 + UI 对齐 Figma 12:144（2026-05-07）

### 现象

HomeStage1/2 的"今日记录"区是 `<EmptyRecord>` 占位（永远空态），跟 records tab 的真 feed 不同步。UI 也跟 Figma 12:144 不一致。

### 修法

#### 共享 selector

records tab 用 `useStore` 读 `mealRecords / fullnessHistory / dialogueHistory / todayKey` + `buildTodayFeed` 拼合。新建 `<HomeRecordsSection>` 用**同一组**调用，确保数据源一致 — 一个 tab 录一条，另一个 tab 立刻反映。

#### 新组件

- `<TodayRecordRow>` — Home 专用记录行（按 Figma 12:144）：
  - mascot 头像 60×60 放在卡**外**左侧
  - 卡内按 kind 切样式：
    - meal/dialogue + photoUri：文案 + 100×100 食物图 + HP delta badge + 时间
    - meal/dialogue 无 photo：文案 + HP delta + 时间
    - fullness：emoji + "今日饱腹度 X/10 · {slot}" + 时间（无 HP delta）
- `<HomeRecordsSection>` — 容器：
  - 头部 "📝 今日记录" + "查看更多 ›" → 跳 records tab
  - 列表只取最近 3 条（`HOME_PREVIEW_LIMIT=3`）
  - 空态走 `<EmptyRecord>`

#### records tab 不动

continues to use `<RecordCard>`（独立单卡，mascot 在卡内左侧）。两套渲染并存 — `<RecordCard>` for records tab，`<TodayRecordRow>` for home。Selector 共享，渲染独立。

#### HomeStage1 / HomeStage2

- 删 inline 的"今日记录"块（标题 + EmptyRecord 兜底）
- 用 `<HomeRecordsSection />` 一行替代
- 同时清理 unused imports（Text / Pressable / useRouter / EmptyRecord 在 stage 1，Text / Pressable / useRouter 在 stage 2）

### 验证（xin reload 后）

- records tab 录一条 → 切回 home → "今日记录"立刻多一条 ✅
- 拍餐 → 自动 push meal + 双 dialogue → home "今日记录"显示 3 条预览（dialogue encourage / dialogue meal_done / meal）+ "查看更多 ›" 跳 records tab 看完整 feed
- 选饱腹度（records tab）→ home 多一条 "今日饱腹度 X/10"

---

## v0.4 hotfix #4：底部 tab icon 全用 Figma 资源（2026-05-07）

### 现状（xin 反馈）

4 个底部 tab 中只有"首页"是绿色叶子（Figma），其它 3 个用了 React Navigation 默认 / 通用图标，跟 Figma 1:420 完整 tab bar icon 库不一致。

### 资源

`app/assets/tab-icons/` 新增 8 张 PNG（实心选中 / 线框未选中）：

| 文件 | Figma node-id | 尺寸 | md5 (前 8) |
|---|---|---|---|
| home-on.png | 12:179 | 139×139 | 7b34b9dd |
| home-off.png | 12:162 | 132×136 | d2273c31 |
| records-on.png | 12:176 | 143×143 | 5281a32d |
| records-off.png | 12:159 | 132×136 | a1259e46 |
| stats-on.png | 12:173 | 126×130 | 6e887886 |
| stats-off.png | 12:156 | 130×130 | 91f12115 |
| my-on.png | 12:170 | 123×139 | 99fc098a |
| my-off.png | 12:153 | 117×133 | c61fb7ff |

8 张 md5 全异。

### `(main)/_layout.tsx` 改造

- 引入 `Image` + `ImageSourcePropType`，每 tab 用 `tabBarIcon: ({ focused }) => <Image source={focused ? on : off} 28×28 contain />`
- `tabBarActiveTintColor` 改为 `#3A6436`（深绿，与 stage 2 倒计时数字色同源）
- `tabBarInactiveTintColor` 改为 `#B4B4B4`（灰）
- `tabBarLabelStyle.fontSize = 12`
- 路由名 `settings` 不改（v0.4 #2 决定保留），label 显 "我的"，icon 用 my-on/off

ICON 字典 + `renderIcon(name)` curry 闭包让 4 个 Screen 一致引用，没有重复 inline JSX。

---

## v0.4 hotfix #5：HomeStage2 hero card 合并 + 文字回归（2026-05-07）

### 起因

xin 反馈之前 hotfix #2 把 hero（mascot 大图）和心形条拆成两个独立 card，跟 Figma df8b0448 设计错位（设计上是同一个 rounded card）。下载新的 mascot-only ip 子组 PNG 后又发现：ip 子组**只**含 mascot，没 baked 文字层，删 `<StatusTitle>` 后 Stage 2 主页失去状态文字。

### 修法（B 路：RN Text overlay 回归）

`HomeStage2` hero card 内部布局：
- 外层 `<View>`：bg.card / border.card 1px / 30 圆角 / overflow:hidden
- 上半截 `flexDirection: 'row'`：
  - 左 column flex:1：title 28pt #3D683F semibold / subtitle 15pt #6E6F6C / hint 14pt #666663（按 Figma 字号比例缩到 simulator viewport，~390/524 系数）
  - 右 mascot Image width=160 + `aspectRatio: band.mascotAspect`
- 下半截：浅绿 `#E8EFD9` 1px divider + `<HpHeartsCard hp={hp} embedded />`

`HpHeartsCard` 加的 `embedded` prop（hotfix #4 已加）此处复用：embedded=true 时不渲染外层 Card，让 hero card 直接作为容器。

### simulator 自截验证

- HP 47 / low band 落屏：mascot=low.png，标题"残血状态"，副标"感觉不太好啊"，hint"好想吃上下一顿"
- 同一 card 内左文右图 + 下方心形条 47/100（4 实心 + 6 空心） + 47/100 数字
- 整张 hero 边界统一 30 圆角，跟 Figma 对得上
- 副 confirm：incomplete 卡 / 今日记录 TodayRecordRow / 4 tab Figma icon 全部在工作

### 流程升级（task 自验工作流）

xin 拍板：以后视觉 hotfix 必须 task **simulator 自截 + Read 视觉对比 Figma** 才能 push（不光 tsc 通过就 commit）。

本次首次落地：`xcrun simctl boot/openurl/io booted screenshot` + computer-use MCP 走 onboarding + 后台 expo run:ios 触发首次 simulator build（svg 没 cache 用了 ~30 分钟）。后续视觉 hotfix 走 reload（terminate+openurl）就够了，不重 build。

### HomeStage1 不动

保持 StatusTitle + 旁边小 mascot 布局（与 Stage 2 不同），HomeStage1 文字独立块。

---

## v0.4 hotfix #6：hero overlap 布局 + 心形条按 Figma 22:3（2026-05-07）

### 起因

xin 反馈 hotfix #5 (`94bb259`) 的 hero 还是不对：
1. 当时是 row 布局（左文 flex:1 + 右 mascot 160 宽），mascot 没"铺满"hero 上半部分
2. 心形条还是简洁版（只有心 + X/100），缺 Figma 22:3 设计的 3 段结构（心形 / 4px 分隔 / hint+数字）

### 修法

#### `src/components/ui/HpHeartsContent.tsx` 新建

按 Figma 22:3 完整 3 段：
- 10 颗 svg `<Path>` 心形（26×24，row + `justify-between` 自动均匀分布），满心 `#8FAE75` / 空心 `#D8E0CA`
- `height: 4` 浅色分隔线 `#E8EFD9`
- 左 "还有 X 个爱心即可晋级下一个阶段"（13pt #747571）+ 右 "X/100"（18pt medium #8FAE75）
  - X = `Math.ceil((100 - hp) / 10)`

`HpHeartsCard`（hotfix #4 加 embedded prop 那个）保留 — HomeStage1 仍用简洁版。两个组件并存：
- `HpHeartsCard`：HomeStage1 用，简洁（心 + X/100，无 hint 行）
- `HpHeartsContent`：HomeStage2 hero 内嵌完整版（3 段）

#### `HomeStage2` hero 重写

- 上半截：`<View aspectRatio: band.mascotAspect position: relative>`
  - `<Image source={band.mascot} StyleSheet.absoluteFillObject resizeMode="cover" />`（mascot 全铺）
  - `<View position: absolute top: 22 left: 22 right: 180>` 文字 overlay
    - title 30pt #3D683F semibold
    - subtitle 16pt #6E6F6C
    - hint 15pt #666663
- 下半截：`paddingHorizontal: 16 paddingVertical: 14-16` + `<HpHeartsContent hp={hp} />`

整张 hero card 30 圆角 + bg.card + border.card 1px + overflow:hidden。

### simulator 自截验证（`/tmp/mealmate-stage2-hero-v3.png`）

HP 47 / low band 落屏：
- ✅ mascot（绿围裙小人 + 飘叶子）铺满 hero 上半部分，不再是缩小图标
- ✅ "残血状态" / "感觉不太好啊" / "好想吃上下一顿" overlay 在左上，深绿字色 vs 浅绿叶子背景可读性 OK
- ✅ 下方 10 颗心（4 实心 + 6 空心）+ 4px 分隔 + "还有 6 个爱心即可晋级下一个阶段" + "47/100" 绿色数字
- ✅ 同一 hero card 30 圆角统一

---

## v0.4 hotfix #7：9 颗 Figma asset 心 + divider PNG（2026-05-07）

### xin 反馈

之前 hotfix #6 用 svg 自画的心形是默认形状，不是 Figma 22:3 设计师画的样式；总数应该是 **9 颗**（不是 10）。

### 资源

`app/assets/hearts/` 新增 3 张：

| 文件 | Figma | md5 (前 8) | 尺寸 |
|---|---|---|---|
| `filled.png` | imgRectangle22 (44c5492a)，server 返回 SVG，本地 `rsvg-convert --width 152 --height 136` 转 PNG | `bf9f5753` | 152×136 |
| `empty.png` | imgImage (3b7b35a9)，原本就是 PNG | `57dcf00d` | 151×131 |
| `divider.png` | imgBackground (d5057a46)，原本就是 PNG | `2457b5fe` | 443×4 |

3 张 md5 全异 ✅。

注：filled asset URL 实际是 SVG 不是 PNG（Figma server 给了 vector），用 macOS `rsvg-convert`（`/opt/homebrew/bin/rsvg-convert`）转 4× retina PNG 入库。

### `HpHeartsContent` 重写

- 9 颗 `<Image source={i < filledCount ? HEART_FILLED : HEART_EMPTY}>`，`width: 28 height: 25`
- `filledCount = round(hp * 9 / 100)`：HP 0→0 / 47→4 / 80→7 / 100→9
- `remaining = 9 - filledCount`，"还有 X 个" 按这个算
- divider 用 `<Image source={DIVIDER} resizeMode="stretch" height: 4 width: 100%>` 替代之前的 borderTopWidth + bg 模拟
- 删除 svg `<Path>` 自画心形 + 颜色硬编

### simulator 自截验证（`/tmp/mealmate-hearts-v4.png`）

HP 47 / low band：
- ✅ 9 颗心（不是 10）
- ✅ 4 颗深绿实心 + 5 颗浅黄绿空心，形状是 Figma 设计师画的
- ✅ divider 用 Figma PNG（细线，跟之前 4px solid bg 视觉接近但更细腻）
- ✅ "还有 5 个爱心即可晋级下一个阶段" + "47/100" 右侧
- ✅ hero overlap 布局保持（上半 mascot 全铺 + 标题 overlay 不变）

---

## v0.4 hotfix #8：mascot 右对齐 + 心形 absolute 浮卡（2026-05-07）

### xin 反馈

1. hotfix #6 / #7 的 mascot 用 `absoluteFillObject + cover`，导致 mascot 角色（在源图右半边）被裁，hero 上半看起来只剩左侧叶子背景
2. 心形条应该是**自带 bg + border 的浮卡**跨在 mascot 底沿（不是从 mascot card 内 layout 出来的同色块）

### 修法

#### Mascot 右对齐 + contain

```tsx
<View aspectRatio: 524/461 overflow: hidden position: relative>
  <Image
    position: absolute
    right: 0 top: 0 bottom: 0
    aspectRatio: band.mascotAspect
    resizeMode="contain"
  />
  <View absolute top:28 left:24 maxWidth:55%>title overlay</View>
</View>
```

`right:0 + top:0 bottom:0` pin 高度撑满，width 由 aspectRatio 自动推。simulator iPhone 16 Plus 屏宽 430pt - 24×2 padding = 382pt，hero height = 382/1.137 ≈ 336pt，image width = 336×1.137 ≈ 382pt 完全贴合 — mascot 角色完整显示。

#### 心形浮卡 absolute

```tsx
<View marginBottom: 32>  {/* 16 心形溢出 + 16 后续间距 */}
  <View mascot card aspectRatio overflow:hidden>
    <Image right anchor />
    <Title overlay />
  </View>
  <View
    position: absolute
    bottom: -16 left: 16 right: 16
    bg: #FDFCF6 border: #D2DEB9 1px
    borderRadius: 30
    padding: 16/14
  >
    <HpHeartsContent hp />
  </View>
</View>
```

心形浮卡 z-index 上层（绝对定位天然层叠），跨 mascot card 底沿 16pt — 视觉上"浮"在 mascot 上沿底部。

### simulator 自截验证（`/tmp/mealmate-mascot-right-v5.png`）

- ✅ mascot 完整显示（角色 + 围裙 + 汗滴 + 飘叶子全部 visible）
- ✅ 心形浮卡自带 bg + border，bottom 跨出 mascot card 16pt
- ✅ 9 颗心 + "还有 5 个" + "47/100" 保持
- ⚠️ 副作用：title overlay 末字（"啊" / "顿"）与 mascot 头发位置重叠，可读性略差。`maxWidth: '55%'` 让文字延伸到 hero 宽度 55% 处，跟 mascot 角色头部重叠。下次 hotfix 视情况调（缩 maxWidth 到 45% / 加 textShadow / 缩短 hint）

---

## v0.4 hotfix #9：HomeStage2 hero mascot 缩到 60%（2026-05-07）

xin 反馈 hero IP 太大。范围最终收窄到**只**改 HomeStage2 hero 的 mascot Image。

### 改动（1 行 effective）

`HomeStage2.tsx` hero `<Image>`：
- 旧：`right:0 top:0 bottom:0 aspectRatio: band.mascotAspect`（撑满 hero 高度）
- 新：`right:0 bottom:0 width: '60%' aspectRatio: band.mascotAspect`（hero 右下角占 60% 宽，aspectRatio 推 height）

hero 容器 aspectRatio 524/461 不变（card 整体高度保持）。mascot 只占 hero 内 60% 宽 × 对应 aspect 高，貼右下，左上腾出大块空白给文字 overlay。

### 顺带解决 hotfix #7 留账

之前 `maxWidth:55%` overlay 文字延到 mascot 头发位置，"啊"/"顿"末字跟头发重叠。mascot 现在缩到右下，文字左上完全独立，**重叠问题自然消失**，可读性 OK。

### 不动的（xin 范围明确收窄）

- ❌ TodayRecordRow 头像 60×60
- ❌ MealReminderCard reminder.png 78×71
- ❌ MealIncompleteCard missed.png 84×76
- ❌ HomeStage1 StatusTitle mascot 130×130
- ❌ Tab bar icon 28×28
- ❌ HpHeartsContent 心形 28×25 + divider
- ❌ 文字 fontSize

### simulator 自截验证（`/tmp/mealmate-hero60-v6.png`）

HP 50 / stable band 落屏（HP 因 missed-scan 又跑了一次，从 47 又减下来；测试时碰巧到 50 stable）：
- ✅ "轻微疲惫"/"能量不足"/"需要好好补充" 文字左上 clean，无重叠
- ✅ stable.png mascot 在 hero 右下角 60% 大小，完整显示（角色 + 围裙 + 飘叶子局部）
- ✅ hero card aspectRatio 不变，整体高度跟 hotfix #7 一样
- ✅ 心形浮卡（5 实心 + 4 空心 + "还有 4 个" + 50/100）跨 mascot 底沿保持
- ✅ 其它板块未受影响
