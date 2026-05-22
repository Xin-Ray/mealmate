# store（zustand 状态层）

- **作用**：全局 source of truth；所有 HP / stage 变更走统一 action 边界，确保不变量
- **代码**：`app/src/store/useStore.ts`（单文件 ~600 行，未来按 slice 拆）；types 在 `app/src/types/index.ts`
- **持久化**：zustand persist + AsyncStorage，key `mealmate-store`，schema **v9**（snack 合并升 v10）
- **核心 actions**：`addHp(delta)`（边界：>=100 advance / <0 demote）、`markMealDone` / `markMealMissed` / `addSnack` / `addWeightRecord` / `addFullnessRecord` / `pushDialogue` / `advanceStage` / `demoteStage` / `consumeTransition` / `markTransitionSeen` / `rollDayIfNeeded` / `__dev_*`（仅 __DEV__）
- **不变量**：`hp ∈ [0,100]`，`currentStage ∈ [1,5]`，每 (slot,date) ≤ 1 条 MealRecord / FullnessRecord，每 date ≤ 1 条 WeightRecord
- **不负责**：UI 渲染 / 业务编排（→ page）、推送 / 网络（→ services）、selector（→ selectors/）

详字段与 migrate 历史 → [04-data-model/tables.md](../04-data-model/tables.md)。
