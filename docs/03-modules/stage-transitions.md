## 模块名称
stage-transitions（阶段过渡屏）

## 模块目标
HP 累到 100 → advance 展示"完成"屏；HP 降到 0 以下 → demote 展示"回到"屏；新用户首次 → stage-1-start 欢迎屏。Plan B v0.5 重构：(stage) group + page presentation slide_from_right，不是 modal。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：transitionsPending（队列）/ transitionsSeen / advanceStage / demoteStage / consumeTransition / markTransitionSeen
- `(main)/_layout.tsx` useEffect：transitionsPending 消费 + transitionsSeen 检查
- UI：`<StageEndScreen>` / `<StageDemoteScreen>` / `<StageStartScreen>`
- [02-business-flows/stage-transition.md](../02-business-flows/stage-transition.md)

## 对外接口
- 路由（11 个 page）：
  - `/(stage)/stage-1-start`（新用户首次）
  - `/(stage)/stage-N-end`（N=1..5，advance 完成屏）
  - `/(stage)/stage-N-demote`（N=1..5，demote 回到屏）
- store action：
  - 触发：`addHp(+delta)` 命中 100 / -delta 命中 <0 自动调
  - 消费：`consumeTransition()`（推屏成功后 pop 队首）
  - 已看：`markTransitionSeen(stage, kind)`（stage-1-start 看完）

## 核心状态
- `transitionsPending: Array<{ stage, kind: 'end' | 'demote' }>` —— 待消费队列
- `transitionsSeen: Array<{ stage, kind }>`（目前主要存 stage-1-start 已看标记）
- `currentStage` / `hp` / `companionLv`

## 核心逻辑
- **advance** 触发：advanceStage 内 push `{ stage: 旧, kind: 'end' }` 到 pending
- **demote** 触发：demoteStage 内 push `{ stage: 旧, kind: 'demote' }`（stage 1 stay 时 push `{ stage: 1, kind: 'demote' }`）
- **消费**：(main)/_layout useEffect 监听 pending 长度，setTimeout(0) 跑：
  - 取队首 → `router.replace('/(stage)/stage-N-{end|demote}')`
  - `consumeTransition()` 立刻 pop（防重复）
- **stage-1-start**：pending 为空 + transitionsSeen 没 `{1,'start'}` → push `/(stage)/stage-1-start`
- **关闭**：每个 stage page 完成按钮 → `router.replace('/(main)/home')`

## 异常情况
| 异常 | 处理 |
|---|---|
| HP 短时间频繁变更 | pending 是数组，排队消费；layout useEffect 一次 push 一个 |
| app 杀掉时 pending 非空 | persist 持久化，下次启动继续消费 |
| stage 5 advance | advanceStage 内 `if (currentStage >= 5) return` no-op，pending 不 push |
| stage 1 demote | 不变 stage，hp=90，push pending → 弹 support 调 modal（PRD §11.L） |
| dev 面板 setStage / setHp | 不走 addHp 边界 → 不触发 advance/demote（要手动调 action） |

## 注意事项
- **Plan B v0.5**：(stage) 从 (modal) group 移出，独立路由 + slide_from_right —— sticky 按钮永远可见
- Stage 3-5 advance 业务逻辑未接入：advanceStage 支持到 5，但 markMealDone 内部不会让 stage 2 → 3（没"通关条件"判定），目前只 stage 1 → 2 真实跑通
- NextStepCard 浅米色 + 无箭头：避免被误以为按钮（[Plan B bug3 fix](#)）
- failure dialogue：demote 时落 dialogueHistory `kind='failure'` + stageWhenFailed 用于 records 留账

## 模块不负责什么
- HP / stage 数字增减 → [store.md](./store.md) 的 addHp / advanceStage / demoteStage
- 触发条件判定（吃饱率 / 体重达标）→ 业务逻辑未接（stage 3-5 PRD 决策中）
- stage page 内部文案 → 各 `stage-N-*.tsx` 硬编码（每屏独立）
- modal 推送 → (stage) 不是 modal group
