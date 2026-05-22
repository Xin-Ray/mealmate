# reminder（餐窗 / 错过餐扫描）

- **作用**：90min 餐窗判定 + missed scan + 倒计时 selector，所有 home 餐次卡 + missed 自动 mark 依赖它
- **代码**：`app/src/store/selectors/reminder.ts`（selectActiveReminderSlot）+ `mealStars.ts`（selectNextMealCountdown, selectTodayMealStars）；`app/src/services/missedScan.ts`（runMissedScan）；`services/notifications.ts`（本地通知）
- **store 字段**：读 `mealSchedules` / `todayMeals` / `mealRecords`；不直接写（写在它调的 `markMealMissed`）
- **常量**：`REMINDER_WINDOW_MIN = WINDOW_MIN_AFTER = 90`（三处一致：reminder.ts / missedScan.ts / mealStars.ts）
- **不负责**：扣分 / push dialogue（→ store.markMealMissed）、推送通知本体（→ services/notifications.ts）、餐打卡（→ photo）
