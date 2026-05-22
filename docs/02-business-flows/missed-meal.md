# 错过餐 + 扣分流程

某餐 schedule + 90min 已过仍未 done → 自动 markMissed + HP -10 + 推 modal。

## 流程图

```mermaid
flowchart TD
  Trigger1[app launch] --> Scan
  Trigger2[AppState.active] --> Scan
  Scan[RootLayout useEffect<br/>runMissedScan] --> Detect{detectMissedSlots<br/>now > schedule+90min<br/>&& status='pending'}
  Detect -- 命中 --> Mark[markMealMissed slot]
  Mark --> AddHp[addHp -10<br/>gentleMode 半 -5]
  Mark --> Records[mealRecords 加<br/>status='missed' hpDelta=-10]
  Mark --> Dialogue1[pushDialogue meal_missed]
  Mark --> Dialogue2[pushDialogue remind]
  AddHp -. addHp 命中 HP<0 .-> Demote[demoteStage]
  Demote --> StageDemote[(stage)/stage-N-demote]
  Mark --> ModalPush{首个 missed?}
  ModalPush -- 是 --> Modal[(modal)/meal-missed]
  Modal -- 我知道了 --> Ack[acknowledgeMissedMeal slot date]
  Ack --> Home((main)/home)
  Home --> HomeSlot{HomeMealStatusSlot}
  HomeSlot -- selectUnackMissedSlot 命中 --> Incomplete[MealIncompleteCard<br/>主页第二板块]
  Incomplete -- 我知道了 --> Ack
```

## 正常流程

1. App 启动 / 用户切回前台 → `RootLayout` useEffect 触发
2. `runMissedScan()`（`services/missedScan.ts`）：
   - `rollDayIfNeeded` 先跑（跨日归档昨日 + reset 今日）
   - `detectMissedSlots(mealSchedules, todayMeals)`：找所有 `now > schedule+90min && status='pending'` 的 slot
3. 对每个新 missed slot：
   - `markMealMissed(slot)`：mealRecords 加一条 missed record，`addHp(-10)`（gentleMode -5），todayMeals[slot] = 'missed'
   - `pushDialogue({kind:'meal_missed', body, mealSlot, hpDelta:-10})`
   - `pushDialogue({kind:'remind', body, mealSlot})`
4. **首个**新 missed slot → `router.push('/(modal)/meal-missed', params:{slot})` 弹 modal（多 slot 不重复弹）
5. 用户点 modal "我知道了" → `acknowledgeMissedMeal(slot, date)` 标 record.acknowledged=true → 关 modal
6. 回 home：若仍有未 ack 的 missed → `<MealIncompleteCard>` 在第二板块显示，用户可再次"我知道了" ack

## 异常流程

| 异常 | 处理 |
|---|---|
| **dedup**：同 slot 同 date 已经 missed | `markMealMissed` 内部 `if (todayMeals[slot]==='missed') return` no-op，不重复扣分 |
| **多 slot 同时 missed**（比如用户睡过头早午都过） | 都 markMissed + 都 push dialogue，但 modal 只弹首个；剩下的次日 ack（home incomplete 卡 cycle 显示） |
| **HP 扣到 0 以下** | `addHp(-10)` 检测到 unclamped < 0 → 走 `demoteStage`：stage>1 退 N-1 hp=90；stage=1 不变 hp=90，都 push pending → home useEffect 触发 `(stage)/stage-N-demote` 屏 |
| **gentleMode 开** | HP_MEAL_MISSED_LOSS=10，gentleMode 时实际扣 `-5`（hpDelta 也是 -5） |
| **跨日 rollDayIfNeeded** | 昨日的 todayMeals 归档进 mealHistory，今日清空 'pending'；昨日的 missed mealRecord 保留在 mealRecords 不动 |
| **app 长时间未启动** | runMissedScan 只跑当日，errored 计算仅基于当前 mealRecords + schedule；多天没开 app 不会补扫历史 missed |

## 状态变化

```
runMissedScan 前: todayMeals[slot]='pending'
扫描命中:
  todayMeals[slot]: 'pending' → 'missed'
  mealRecords: 加 { status:'missed', mealSlot, ts:now, hpDelta:-10, acknowledged: undefined }
  hp: -10（clamped 0-100；若 unclamped<0 走 demote 路径 hp=90 + stage 可能 -=1）
  dialogueHistory: 加 2 条（meal_missed + remind）
modal "我知道了": mealRecords[i].acknowledged = true（home 第二板块卡片消失）
```

## 注意事项

- **窗末判定 90min** 跟 ReminderCard 的 windowEnd 一致（`reminder.ts` REMINDER_WINDOW_MIN = `missedScan.ts` WINDOW_MIN_AFTER = 90）
- meal-missed modal 现已是次入口（v0.4 §11.F.2 起），主要交互走 home 上的 MealIncompleteCard
- **gentle mode** 在 settings 切，影响所有未来 missed 扣分；过去已扣的不追溯改
- **HP→0 安全规则**：stage 1 走 support 调建议医生（[PRD §11.L](../PRD.md)），不是惩罚

## 模块不负责

- 用户主动标记错过 —— 没有这个 UI，只能等系统扫描
- 错过餐补救 —— 之前 makeUp 方案已废弃，改成不依赖 missed 状态的常驻 SnackCard（[snack.md](./snack.md)）
- 推送通知本身 —— `services/notifications.ts`
- HP 降到 0 的具体 modal 文案 —— [stage-transition.md](./stage-transition.md)
