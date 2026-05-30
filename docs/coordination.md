# Cross-session coordination

> mealmate 同时有多个 agent / claude session 在干活。这份文档防止撞车。
> 每次开新跨域工作前先在这登记 + commit msg 里 `@对方` 标记。

---

## 角色分工

| 角色 | 范围 |
|---|---|
| **frontend**（cowork session）| UI 反馈实现 / RN 组件 / stage home 复用 / 样式 / 设计落地 / 文案 / icon / onboarding flow / `app/app.config.ts`（expo config）|
| **backend**（Claude Code session）| 账号同步 / Apple Sign In / Gemini key / EAS env / API / 推送 / sync 协议 / Cloudflare / systemd / DDNS / backend/ 目录 / `ios/mealmate.xcodeproj/project.pbxproj` |
| **共享文件**（双方都可改但要登记）| `app/src/store/useStore.ts` schema（特别是加字段）/ selectors / `docs/PRD.md` / `docs/components.md` / `app/src/theme/tokens.ts` / `CLAUDE.md` / `app/eas.json` |

> ⚠️ **2026-05-30 r2 起：`app/app.config.ts` 是 canonical（**没有 `app.json`**）。frontend 维护。backend 如果要加 expo config 字段，请在 `app.config.ts` 里加，**不要新建 `app.json`**（expo 优先级 app.config.ts > app.json，新建 app.json 不会生效，反而让人困惑）。 bundleId 仍然由 pbxproj 决定（backend 领地）—— `app.config.ts` 里 `ios.bundleIdentifier` 只是 prebuild base value，不会覆盖现 pbxproj 配置。

---

## 提交规则

| 分支前缀 | 谁用 |
|---|---|
| `feat/frontend-*` / `fix/frontend-*` / `style/*` | frontend |
| `feat/backend-*` / `fix/backend-*` / `chore/sync-*` / `chore/infra-*` | backend |
| `release/*` / `docs/*` | 任一，按内容自然归 |

- 修共享文件（特别是 store schema 加字段）：必须在这 doc 的「进行中的跨域工作」段登记 + commit msg 里写 `@frontend` 或 `@backend` 标记
- push 前先 `git fetch origin && git log origin/main..HEAD` 确认还在 main HEAD 上；远端有新 commit 时 rebase or 跟对方对一下再 push
- 双方都不要 force push 到 main 或对方的分支

---

## Backend TODO（frontend 留给 backend 的事项）

- **TestFlight 体重 OCR / mascot LLM 全挂** — eas.json production / preview build 没注入 `EXPO_PUBLIC_GEMINI_KEY`。已在 `docs/issue-fix-plan-v1.1.md` §6.1 记录 EAS env:create 命令清单，等 backend 执行
- **运动数据 (issue OPEN-R1-C)** — 前端 `app/src/components/ui/ExerciseCard.tsx` 是骨架占位（hardcoded "今日 0/1 次"），按钮 onPress 弹 Alert "开发中"。需要 backend 决定：
  - store 加哪些字段？候选 `exerciseHistory: Array<{ ts, kind, durationMin?, photoUri? }>`
  - 拍照 flow（新 `(modal)/exercise.tsx` 还是复用 photo modal 加 `?kind=exercise` 参数？）
  - 是否需要后端 endpoint（运动数据也是个人健康数据，可能跟 sync.ts 一起 push/pull）
- **食物种类标签数据源（r1 risk 2）** — Stage 4/5 home 的 WeeklyFoodProgress 模块「主食 1/2」「蔬菜 1/2」目前是 mock。需要决定：
  - 引入手动「食物标签」字段在 fullnessHistory？
  - 还是用 YOLO detect 结果反推分类？
- **stage 5「不朽印记 50」"50" 的真实数据源（OPEN-4）** — 当前 hero 显示 `不朽印记 {stage5Stars || 50}`，是 stars 累计还是另一字段？

## Frontend TODO（backend 留给 frontend 的事项）

- **Apple Sign In UI 完成度** — settings.tsx 已加（commit `1b28f31`），需要 frontend 装机过一遍流程 + 截图反馈
- **登录后云端同步状态展示** — 当前 settings 只有「刚刚同步 / 几分钟前」文本。是否要在 home 顶部加 sync 状态 icon？等 backend 给指引
- *(空，等 backend 添加)*

---

## 进行中的跨域工作

| Session | 分支 | 摸到的共享文件 | 状态 |
|---|---|---|---|
| frontend | `feat/frontend-v1.1-r2`（基于 origin/main `9eedf49`）| 暂无（idle，等任务） | 2026-05-30 audit + setup |
| backend | *(等 backend 自己来登记)* | — | — |

---

## 历史汇合记录

- **2026-05-30** xin 把 `feat/stage-4-5-ui`（r1 13 反馈全套 + 我手抓的 env-split）跟 `feat/weight-ocr`（backend 账号同步）汇合进 `main`。其中：
  - r1 13 反馈代码全部保留 ✅（F1-F13 + StageChip + WeekStripConnected + ExerciseCard + 完成% 公式 + 等）
  - env-split 的 `app.config.ts` / `plugins/withBundleIdSuffix.js` **没保留**（回退 `app.json` + 直接编辑 pbxproj 把 Debug → `.dev` / Release → prod，bundle 隔离仍生效）
  - env-split 的新 mascot 男孩 icon **没保留**（回退 v1.0 老 icon 393KB）
  - 加了 v12 schema：`account` + `lastSyncedAt` + Apple Sign In + sync 服务
  - 加了 `backend/` 目录（monorepo 化，commit `b26fb57`）
  - 当前 main HEAD = `9eedf49`
- **新规则**（xin 2026-05-30 拍板）：frontend 只改前端 + 公共文件；后端任务留 issue 或这个 doc。不撞 branch。
