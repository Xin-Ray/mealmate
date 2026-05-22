## 模块名称
reminder（餐窗 / 错过餐扫描）

## 模块目标
管"现在该不该提醒用户吃饭"和"是不是已经错过了"。所有 home 餐次卡 + 推送通知 + missed scan 都依赖它。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：mealSchedules / todayMeals / mealRecords / settings.gentleMode
- `services/missedScan.ts`：runMissedScan / detectMissedSlots
- `services/notifications.ts`：本地通知调度
- [02-business-flows/missed-meal.md](../02-business-flows/missed-meal.md)

## 对外接口
- selector：
  - `selectActiveReminderSlot(state)` —— 当前窗内未 done 的 slot（90min 窗），用于 MealReminderCard
  - `selectNextMealCountdown(state)` —— 下一餐倒计时（跳过 done 的）
  - `selectTodayMealStars(state)` —— 今日 3 slot 状态星
  - `selectUnackMissedSlot(state)` —— 未 ack 的 missed slot，用于 MealIncompleteCard
- service：`runMissedScan()` —— app 启动 / AppState.active 触发
- 常量：`REMINDER_WINDOW_MIN = 90`（reminder.ts），`WINDOW_MIN_AFTER = 90`（missedScan.ts / mealStars.ts）

## 核心状态
- `mealSchedules`：{ breakfast: "08:00", lunch: "12:30", dinner: "18:30" }
- `todayMeals[slot]`：'pending' | 'done' | 'missed'
- 当前 ts（Date.now()）

## 核心逻辑
- **窗口定义**：`[schedule, schedule + 90min]`，窗内未 done 是"该提醒"，窗外 = "错过"
- `selectActiveReminderSlot`：扫 3 slot，找到第一个 `now >= schedule && now <= schedule+90 && status=pending`
- `selectNextMealCountdown`：扫今日剩余 slot 找未来最近的；**跳过 done 的**（[Issue #1 fix](#)）
- `runMissedScan`（启动 / AppState.active）：
  1. `rollDayIfNeeded()` 先跑
  2. `detectMissedSlots()` 找所有 `now > schedule+90 && pending`
  3. 每个 → `markMealMissed(slot)` + 双 pushDialogue
  4. **首个**新 missed → `router.push('/(modal)/meal-missed')`

## 异常情况
| 异常 | 处理 |
|---|---|
| 用户长时间没开 app | runMissedScan 只扫当日，多天未开不补扫历史 missed |
| schedule 改了已 done 的时间 | 不影响（done 不再判 window） |
| 跨日 0:00 | rollDayIfNeeded 归档 + reset 今日 |
| 多个 slot 同时 missed | 都标 missed + 都 push dialogue，modal 只弹首个 |
| gentle mode 开 | 扣分 -10 → -5，dialogue.hpDelta 也跟着 |

## 注意事项
- **三处 90min 一致**：reminder.ts REMINDER_WINDOW_MIN / missedScan.ts WINDOW_MIN_AFTER / mealStars.ts WINDOW_MIN_AFTER 都是 90，改动需三处同步
- `selectNextMealCountdown` 跳过 done 的是 [Issue #1](#) 修：之前用户拍完早餐还看到"早餐倒计时"
- runMissedScan 触发时机：RootLayout useEffect + AppState change listener
- meal-missed modal 是次入口；主入口是 home 上的 MealIncompleteCard

## 模块不负责什么
- 实际扣分 / push dialogue → [store.md](./store.md) 的 markMealMissed
- 推送通知本身 → `services/notifications.ts`
- 餐打卡 / 加餐 → [photo.md](./photo.md)
- HP→0 时的 demote → [stage-transitions.md](./stage-transitions.md)
