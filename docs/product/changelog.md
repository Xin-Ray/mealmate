# Changelog

按版本归类，倒序排列。详细技术过程见 [`docs/dev/dev-log.md`](../dev/dev-log.md)。

## v1.0.1（进行中，`fix/issues-6-7-meal-timing` 分支）

**主题**：餐窗 / 提醒 hotfix（2026-05-22 真机反馈）。

### Fixed

- **Issue #6c**：餐窗起点从 `schedule -90min` 改成 `schedule`，窗口 `[schedule, schedule+90min]`（之前提前 1.5h 显示提醒卡是 bug）
- **Issue #6b**（新需求）：每餐加一条 `schedule +60min`（= 窗末前 30 分钟）的二次 DAILY 本地通知；顺带兜底 6a iOS DAILY trigger 偶发不响
- **Issue #7**：onboarding 完成时已过完的窗不再 mark missed —— `runMissedScan` 加 `windowEnd > onboardingCompletedAt` 守卫，避免刚走完 onboarding 就弹错过餐 modal

### Migration

- v9 → v10：加 `onboardingCompletedAt: number | null`。已 onboarded 的老用户回填 `0`（保旧行为），未 onboarded 保持 `null`，下次 `finishOnboarding` 设 `Date.now()`

### 待办

- 真机验证（xin）：4 个场景见仓库根 `README.md` v1.0.1 段
- 通过后切 production EAS build → TestFlight build 2

---

## v1.0.0 — 2026-05-18

**主题**：正式 release —— EAS Build + TestFlight 准备就绪。

main HEAD `87b0f21`（merge: feat/weight-ocr → main，YOLO food detection + retake button）。

### 累计 main 上 commit（v0.4 之后到 v1.0）

约 18 个 feature/fix commit + 5 个 merge commit，覆盖：

- **Stage 1 hotfix** — HomeStage1 对齐 Stage 2 hero + 初始 HP 60 / Stage 2 50 + persist v5→v6 migrate
- **Stage Transitions**（11 屏）— stage-1-start + 5 个 stage-N-end + 5 个 stage-N-demote；transitionsPending 队列 + addHp 统一边界（>=100→advanceStage / <0→demoteStage）；Plan B 重构：移出 (modal) → (stage) group + ScrollView+sticky footer + NextStepCard 视觉降级
- **Stage 1 HP→0 安全规则**（PRD §11.L）— support 调 modal "需要支持" + 建议联系医生 / 营养师 + 暖橘 + 🌫️ mascot；同时 pushDialogue kind=failure 留账
- **NextMealCard** — home 第二板块默认 fallback（替代 null 隐藏分支）：下一顿倒计时 + 3 颗星今日进度
- **Weight OCR**（Gemini 2.5 Flash Vision）— 体重秤拍照自动 OCR kg 数字 + null 兜底手填
- **YOLO Food Detection** — photo 拍照打卡接 self-host backend `/detect`，result 屏显示识别 chips；fail-soft（后端挂时仍打卡）；加 **重拍按钮 + confirmedOnce 守卫**
- **Docs 大重组** — `docs/{product,design,api,architecture,dev,deploy}` 6 大类 + UX flow mermaid 图

### Persist 版本

`mealmate-store` schema bump 累计：v1 → **v9**（含 transitionsSeen / transitionsPending / stageWhenFailed 字段）。老用户全部 migrate 兼容。

### Native 依赖

⚠️ 这一版**没引入新 native module**。Weight OCR 和 YOLO Food Detection 都用 `fetch` + `FormData` + `Blob`/`FileReader`（RN 原生）。**iPhone 已装的 dev build 摇手机 reload 即可拉到新 JS bundle 用**。

### EAS Build 准备

- `app/app.json`：`version: 1.0.0` + `ios.buildNumber: "1"` + `bundleIdentifier: com.xinray.mealmate`
- `app/package.json`：`version: 1.0.0`（之前就是）
- `app/eas.json`：新建，含 `development` / `preview` / `production` 3 个 profile + `submit.production.ios`（ascAppId 留 TODO，等 xin 在 App Store Connect 建 app record 后填）
- icon 1024×1024 ✓，splash-icon 1024×1024 ✓
- 真实 `eas build` 还没跑（需要 xin 亲自 login + 输 Apple credentials）—— 见 [`docs/deploy/release.md`](../deploy/release.md)

---

## v0.4 — 2026-05-01 → 2026-05-07

**主题**：视觉对齐 Figma + IA 重构 + 餐后消息规则。

### Added

- 4 tab IA：首页 / 记录 / 统计 / 我的（v0.4 #1）
- 记录页 UI + 饱腹度评分（3 选 1：😞/😐/😊 → 3/5/8 分）
- 统计页：爱心 + 体重双趋势图（react-native-svg），稀疏降级提示
- 错过餐自动扫描（runMissedScan）+ 双消息 + missed modal 触发
- HP band mascot 4 张专属图（stage 2: full / stable / low / critical）
- (modal) group + meal-reminder / meal-missed / photo / weight-entry 全部 modal
- 9 颗 Figma asset 心 + 分隔线 PNG（替换 svg `<Path>`）
- 底部 tab icon 全用 Figma 资源（实心/线框双态）

### Changed

- HP 标度 0–15 → **0–100**（× 6.67 migrate；4 band：满血/平稳/低血/濒临）
- HomeStage1 / HomeStage2 统一 hero 骨架（hotfix #5-#8 多次迭代）
- 起始 HP：stage 1 = 60 / stage 2 = 50（hotfix #13）
- 组件库整理 → `app/src/components/{ui,home}/`
- "我的" 页全 token 化（v0.4 #14）
- (modal) photo 恢复 "从下推上来" 视觉（v0.4 §11.K 第 10 项）

### Fixed

- stage2 hero hp band 自动跳转死循环
- weight-entry 键盘弹起遮挡确认按钮（加 ScrollView）
- stats X 轴改记录时间 + 去掉空数据虚线圈
- 删饱腹 picker + 标题"记录" + 按日期 group + 新 mascot 头像

### Migration

- store persist v1 → v6（v0.4 期间累计）：
  - v1→v2：HP × 6.67 缩放到 0-100
  - v2→v3：加 `fullnessHistory: []`
  - v3→v4：`dialogueHistory` shape `string[]` → `DialogueRecord[]`；加 `mealRecords: []`
  - v4→v5：noop（`MealRecord` 加可选 `acknowledged`）
  - v5→v6：noop（起始 HP 调整，老用户 hp 保留）

### Removed / Deprecated

- LLM 文案生成临时禁用（key 暴露问题，等 v0.5 Worker 代理）
- ChatGPT 登录 onboarding 屏（删，回归 3 步：eating / schedule / name）
- 孤儿组件 `HpBar.tsx` / `MealCard.tsx`

---

## v0.3 — 2026-05-01

**主题**：Stage 2 体重模块 + 三餐推送。

### Added

- expo-notifications 三餐本地推送（按 schedule 调度）
- Stage 2 主页 + 体重模块 / weight-entry modal
- HP 累到上限触发 advanceStage → Stage 2

### Changed

- Bundle ID 改 `com.xinray.mealmate`
- 临时关闭 LLM（Mascot 文案）

---

## v0.2 — 2026-04-25 → 2026-04-28

**主题**：Stage 1 UI shell（mock data）。

### Added

- Expo SDK 54 + Expo Router 6 + TypeScript 5.9 项目骨架
- NativeWind v4 + Reanimated v4 + Zustand v5 + AsyncStorage persist
- Onboarding 3 屏：eating / schedule / name
- (main) home / photo / settings + (placeholder) stage2
- HP 区间（虚弱/饿/恢复/开心）+ markMealDone(+0.5) / markMealMissed(-1)
- 24 条台词池 × band × slot + 最近 5 条防重复
- 消失暗示文案 7 天最多 1 次（PRD §八）
- 删除账号 / 重置数据
- Mascot LLM 接入决策（反馈 #6，最终在 v0.3 关闭）

---

## v0.1 — 2026-04-21

**主题**：PRD 起草 + 技术选型。

### Added

- `docs/PRD.md`：产品需求文档（一句话概述 / 目标用户 / HP 机制 / 五阶段 / MVP 范围 / 技术选型 / 安全边界）
- `docs/tech-research.md`：跨平台调研（RN / Flutter / Capacitor / PWA / SwiftUI+Next.js 对比）
- 推荐技术栈：**React Native + Expo + React Native Web**
