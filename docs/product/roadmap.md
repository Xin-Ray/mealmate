# MealMate Roadmap

| 版本 | 时间 | 主题 | 状态 |
|---|---|---|---|
| v0.1 | 2026-04-21 | PRD 起草 + 技术选型（RN + Expo + RNW）| ✅ done |
| v0.2 | 2026-04-25 | Stage 1 UI shell（mock data） | ✅ done |
| v0.3 | 2026-05-01 | Stage 2 体重模块 + 三餐推送 | ✅ done |
| v0.4 | 2026-05-07 | 视觉对齐 Figma + IA 重构（4 tab + 5 modal）+ 餐后消息规则 | ✅ done |
| v0.5 | 计划 2026-06 | 后端 + Pro 订阅 + LLM 接回（Cloudflare Worker 代理）| 🟡 planning |
| v1.0 | 计划 2026-07 | TestFlight 公开测试 | 🔵 future |

## v0.5 计划范围（已挂账事项）

下面这些事都从 PRD §十一 / dev-log v0.4 收尾 留账下来：

### 后端 / 同步

- Cloudflare Worker：`POST /v1/llm/generate`（mascot 文案）/ `POST /v1/vision/classify`（食物识别）— v0.4 因 key 暴露临时禁用，v0.5 走代理
- Apple Sign In + JWT 鉴权
- 服务端数据库（User / MealEvent / WeightLog / Subscription tables）—— 见 `docs/architecture/database.md` 预案
- 客户端 → 服务端增量同步（mealRecords / weightHistory / fullnessHistory）

### Pro 订阅

- AI 营养分析（蛋白质 / 蔬菜 / 碳水 / 油脂结构）
- AI 角色聊天（基于近期饮食与 HP 状态）
- 周报智能小结
- 详见 `docs/product/business-model.md`

### 客户端补完

- Stage 3 / 4 / 5 业务逻辑（当前仅 Stage 1→2 advance；过渡屏数据 + UI 已就位但 advance 逻辑未实施）
- Stage 1 mascot 4 band 专属图（当前全部用 full.png 兜底）
- 统计页 stage history（当前只显示当前阶段一个点）
- 平滑曲线插值（当前直线段）
- 我的页 Figma 精对齐（v0.4 仅做了 token 化）
- 真平台权限文案 / iPad 适配

### 视觉资源

- Figma 五阶段过渡屏 illustration（当前用 emoji 占位 🧒/🌿/⚖️ 等）
- "我的" 页 Figma frame 链接（xin 未提供）

## v1.0 目标

- TestFlight 100 人 beta
- App Store 上线
- 监控 + 错误上报（Sentry）
- 隐私政策 + 用户协议
