# Changelog

按版本归类，倒序排列。详细技术过程见 [`docs/dev/dev-log.md`](../dev/dev-log.md)。

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
