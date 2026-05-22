# stage-transitions（阶段过渡屏）

- **作用**：advance / demote / stage-1-start 屏；(stage) group + page presentation slide_from_right（Plan B v0.5，**不是** modal）
- **代码**：`app/app/(stage)/stage-{1..5}-{start,end,demote}.tsx`（11 个），`app/src/components/stage/{StageEndScreen,StageDemoteScreen,StageStartScreen}.tsx`；layout 推送在 `app/app/(main)/_layout.tsx`
- **store 字段**：`transitionsPending` / `transitionsSeen` / `currentStage` / `hp`；写：`consumeTransition` / `markTransitionSeen`（advance/demote 由 addHp 边界触发）
- **不负责**：HP / stage 数字增减（→ store）、stage 3-5 进阶触发条件（PRD 决策中，业务逻辑未接）、modal 推送（不是 modal group）

详 [02-business-flows/stage-transition.md](../02-business-flows/stage-transition.md)。
