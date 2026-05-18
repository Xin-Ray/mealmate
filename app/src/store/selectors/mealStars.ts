// 三餐进度星 + 下一顿倒计时 selectors（v0.5 NextMealCard）
//
// 配合 HomeMealStatusSlot 的"无活动 reminder + 无未 ack missed"分支：
// 显示 NextMealCard 而不是 null。
//
// 复用 reminder.ts 的 REMINDER_WINDOW_MIN（90min）作为窗口长度。
// 这里只用 windowEnd 判定（schedule + 90min）—— pre-window 阶段不算"过窗"。

import type { MealRecord, MealSchedule, MealSlot, TodayMeals } from "@src/types";

const WINDOW_MIN_AFTER = 90; // 跟 missedScan.ts 一致

export type MealStar = "done" | "missed" | "pending";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

const parseHHmm = (hhmm: string, base: Date): Date => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

/**
 * 今日三餐进度星：直接读 todayMeals（store 维护的当日 status）
 * 'done' / 'missed' / 'pending' 一一对应。
 */
export function selectTodayMealStars(state: {
  todayMeals: TodayMeals;
}): Record<MealSlot, MealStar> {
  return {
    breakfast: state.todayMeals.breakfast,
    lunch: state.todayMeals.lunch,
    dinner: state.todayMeals.dinner,
  };
}

export type NextMealCountdown = {
  slot: MealSlot;
  isNextDay: boolean; // 三餐都过 → 明天早餐
  targetTs: number; // 目标时刻 ms（schedule HH:MM 当日 / 明日）
  secondsRemaining: number;
};

/**
 * 下一顿倒计时：找到下一个"还能吃 / 还没到"的餐。
 *
 * 规则：
 * - 顺序扫描 [早, 午, 晚]：第一个满足 (now < windowEnd) 的 slot 即为下一顿
 *   · 它的 status 可以是 pending / done / missed —— 都不重要，关键是窗口还没结束
 *     （如果是 done/missed，提前进窗内时 HomeMealStatusSlot 会切到 ReminderCard
 *     / IncompleteCard；window 内但 NOT done/missed 时也是 ReminderCard）
 *   · NextMealCard 主要在「pre-window 阶段」显示倒计时；窗内时一般已被
 *     ReminderCard 接走
 * - 三个 slot 都过了窗末 → 目标是明天早餐
 *
 * targetTs 用 schedule HH:MM 当日（不减 90min），最自然的"距离午餐还有 X"读感。
 */
export function selectNextMealCountdown(
  state: { mealSchedules: MealSchedule },
  now: Date = new Date()
): NextMealCountdown {
  for (const slot of SLOTS) {
    const scheduleTime = parseHHmm(state.mealSchedules[slot], now);
    const windowEnd = new Date(
      scheduleTime.getTime() + WINDOW_MIN_AFTER * 60 * 1000
    );
    if (now < windowEnd) {
      const targetTs = scheduleTime.getTime();
      return {
        slot,
        isNextDay: false,
        targetTs,
        // 如果已经过 schedule 但还在 windowEnd 内，secondsRemaining 会是 0（不显示负数）
        secondsRemaining: Math.max(0, Math.floor((targetTs - now.getTime()) / 1000)),
      };
    }
  }
  // 三餐都过了窗末 → 明天早餐
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowBreakfast = parseHHmm(state.mealSchedules.breakfast, tomorrow);
  return {
    slot: "breakfast",
    isNextDay: true,
    targetTs: tomorrowBreakfast.getTime(),
    secondsRemaining: Math.max(
      0,
      Math.floor((tomorrowBreakfast.getTime() - now.getTime()) / 1000)
    ),
  };
}

// 格式化倒计时 secondsRemaining → "HH:MM:SS"
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// 仅给 records 用：从 mealRecords 推导某天的 stars（todayMeals 是当日实时的；
// 历史日子需要看 mealHistory，本 selector 不覆盖那个）
export function deriveStarsFromMealRecords(
  records: MealRecord[],
  date: string
): Record<MealSlot, MealStar> {
  const result: Record<MealSlot, MealStar> = {
    breakfast: "pending",
    lunch: "pending",
    dinner: "pending",
  };
  for (const r of records) {
    if (r.date !== date) continue;
    if (r.status === "done") result[r.mealSlot] = "done";
    else if (r.status === "missed" && result[r.mealSlot] !== "done") {
      result[r.mealSlot] = "missed";
    }
  }
  return result;
}
