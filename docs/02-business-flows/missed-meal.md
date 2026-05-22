# 错过餐 + 扣分

`schedule + 90min` 已过仍 pending → 自动 markMissed + HP -10 + 推 modal。

```mermaid
flowchart TD
  Trigger[app launch / AppState.active] --> Scan[runMissedScan]
  Scan --> Detect{detectMissedSlots<br/>now > schedule+90min<br/>&& pending}
  Detect -- 命中 --> Mark[markMealMissed<br/>+addHp -10<br/>gentle -5]
  Mark -. HP<0 .-> Demote[demoteStage → (stage)/stage-N-demote]
  Mark --> ModalPush{首个 missed?}
  ModalPush -- 是 --> Modal[(modal)/meal-missed]
  Modal -- "我知道了" --> Ack[acknowledgeMissedMeal]
  Ack --> Home((main)/home)
  Home --> Card{未 ack missed?} -- 是 --> Incomplete[MealIncompleteCard 主页二板块]
  Incomplete -- "我知道了" --> Ack
```

## 正常
1. App 启动 / 切回前台 → `RootLayout` useEffect → `runMissedScan()`
2. `rollDayIfNeeded` → `detectMissedSlots` → 每个新 missed slot：
   - `markMealMissed(slot)`：todayMeals[slot]='missed' + addHp(-10) + 加 mealRecord
   - 双 pushDialogue（meal_missed + remind）
3. **首个**新 missed → 弹 `(modal)/meal-missed`；后续 home `MealIncompleteCard` cycle 显示
4. 用户点"我知道了" → `acknowledgeMissedMeal(slot, date)`

## 异常
| 异常 | 处理 |
|---|---|
| 同 slot 已 missed | `markMealMissed` 内 `if (todayMeals[slot]==='missed') return` no-op |
| 多 slot 同时 missed | 都 mark + 都 push dialogue；modal 只弹首个 |
| HP 扣到 0 以下 | addHp 内 unclamped<0 → demoteStage（stage>1 退 N-1 hp=90；stage=1 stay hp=90 走 support 调） |
| gentle mode 开 | -10 → -5；hpDelta 跟随 |
| 长时间未开 app | runMissedScan 只扫当日，不补扫历史 |

## 状态变化
- `todayMeals[slot]`: pending → missed
- `hp`: -10（或 gentle -5），unclamped<0 走 demote 路径 → hp=90 + 可能 stage-=1
- `mealRecords`: 加 `{status:'missed', slot, hpDelta:-10, acknowledged:undefined}`
- `dialogueHistory`: 加 2 条
- ack 后：`mealRecords[i].acknowledged=true`（home 第二板块卡消失）

90min 窗口 = reminder.ts `REMINDER_WINDOW_MIN` = missedScan.ts `WINDOW_MIN_AFTER`，三处常量一致。
