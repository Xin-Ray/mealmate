## 模块名称
store（zustand 状态层）

## 模块目标
全局单一 source of truth：用户进度（stage / HP / companionLv）、当日餐状态、各历史 list、过渡队列、设置。所有写操作经统一 action 边界，确保 HP/stage 不变量永远成立。

## 负责人
xin

## 依赖模块
- 无（最底层），只依赖 zustand + AsyncStorage
- 被几乎所有模块依赖（home / records / stats / settings / photo / weight-entry / reminder / stage-transitions）

## 对外接口
- 路径：`app/src/store/useStore.ts`
- 持久化：zustand persist 中间件 → AsyncStorage key `mealmate-store`，schema **v9**（snack 合并后升 v10）
- 主要 actions：
  - **HP/stage**：`addHp(delta)` / `advanceStage()` / `demoteStage()` / `consumeTransition()` / `markTransitionSeen(stage, kind)`
  - **餐打卡**：`markMealDone(slot, {photoUri})` / `markMealMissed(slot)` / `acknowledgeMissedMeal(slot, date)`
  - **加餐**：`addSnack({photoUri})`（snack 分支）
  - **体重**：`addWeightRecord({kg, photoUri?})`
  - **饱腹度**：`addFullnessRecord({slot, date, rating})`
  - **dialogue**：`pushDialogue(entry)`
  - **跨日**：`rollDayIfNeeded()`
  - **onboarding**：`finishOnboarding({eatingProfile, schedules, userName})`
  - **settings**：`setGentleMode` / `setSkipWeightPhoto` / `setMealSchedule` / `setUserName`
  - **重置**：`resetAll()`
  - **dev**（`__DEV__` only）：`__dev_setHp` / `__dev_setStage` / `__dev_pushDialogue` / `__dev_triggerAdvance` / `__dev_triggerDemote`

## 核心状态
- `currentStage: 1..5`
- `hp: 0..100`
- `companionLv: number`
- `userName: string`
- `eatingProfile: 'gain' | 'maintain' | 'lose'`
- `mealSchedules: { breakfast, lunch, dinner }`
- `todayMeals: Record<slot, 'pending'|'done'|'missed'>`
- `todayKey: string`（YYYY-MM-DD，跨日比对用）
- `mealRecords: MealRecord[]`
- `dialogueHistory: DialogueEntry[]`
- `weightHistory: WeightRecord[]`
- `fullnessHistory: FullnessRecord[]`
- `transitionsPending: Array<{ stage, kind }>`
- `transitionsSeen: Array<{ stage, kind }>`
- `mealHistory: Record<date, todayMealsSnapshot>`（归档昨日）
- `settings: { gentleMode, skipWeightPhoto }`

## 核心逻辑
- **HP 边界 addHp(delta)**：
  - newHp = clamp(hp + delta, 0, 100)
  - unclamped = hp + delta
  - 若 unclamped >= 100 → 调 `advanceStage()`
  - 若 unclamped < 0 → 调 `demoteStage()`
  - 否则 → set hp = newHp
- **advanceStage**：currentStage<5 → +=1, hp=50, companionLv+=1, push pending `{旧, 'end'}`
- **demoteStage**：currentStage>1 → -=1, hp=90, push pending `{旧, 'demote'}`；stage 1 → stay 1, hp=90, push pending `{1, 'demote'}`（support 调）
- **rollDayIfNeeded**：todayKey != now date → 归档 todayMeals 进 mealHistory，reset 'pending'
- **persist migrate**：v1 → v9 各版本迁移函数（加字段 / rename / 补 default）

## 异常情况
| 异常 | 处理 |
|---|---|
| HP 单次跨过 0 和 100 | 不可能（单 delta），路径互斥 |
| persist hydrate 失败 | zustand 回 default state（用户重新走 onboarding） |
| migrate 失败 | 当前 fallback：throw 让 user 看到错误（v1.1 计划改成 reset） |
| AsyncStorage write 慢 | persist 自动 debounce，不阻塞 UI |
| dev action 在 production | `if (__DEV__)` 守门，release build 整块不存在 |
| dialogueHistory 无限增长 | 当前不裁；后续考虑保留最近 90 天 |

## 注意事项
- **schema 升版**必加 migrate 函数（[04-data-model/tables.md](../04-data-model/tables.md)）
- **HP/stage 不变量**：HP ∈ [0, 100]，stage ∈ [1, 5]，由 addHp 边界保证
- **action 必走边界**：禁用 `set({hp:200})`，要用 addHp；dev 例外但要清楚自己绕开了
- gentle mode 影响 markMealMissed 扣分系数，markMealDone +5 不变
- snack 分支：addSnack 内有 todayCount 三层防御（store 自己也兜底）

## 模块不负责什么
- UI 渲染 → 各 page / component
- 业务流程编排（什么时候调哪个 action）→ 上层 modal / page
- 推送 / 网络 → services 层
- 选择性 query → selectors（reminder / mealStars / stats）
