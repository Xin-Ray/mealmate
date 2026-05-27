// 提醒卡 selectors（v0.4 hotfix；Issue #6 fix 2026-05-23）
//
// HomeMealStatusSlot 用：决定首页第二板块显示什么
// - 当前在某 mealWindow 内 + 该 slot 今日未 done → MealReminderCard
// - 否则有未 ack 的 missed slot → MealIncompleteCard
// - 否则 null（不显示）
//
// 窗口定义（xin 拍板，Issue #6(c)）：[schedule, schedule + 90min]，从提醒时刻起算。
// 旧实现 [schedule - 90min, schedule + 90min] 让用户提前 1.5h 就看到提醒，体验不对。

import type { MealRecord, MealSchedule, MealSlot } from "@src/types";

export const REMINDER_WINDOW_MIN = 90;

const parseHHmm = (hhmm: string, base: Date): Date => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

export type ActiveReminder = {
  slot: MealSlot;
  windowEnd: Date;
};

export function selectActiveReminderSlot(
  state: {
    mealSchedules: MealSchedule;
    mealRecords: MealRecord[];
    todayKey: string;
  },
  now: Date = new Date()
): ActiveReminder | null {
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  for (const slot of slots) {
    const scheduleTime = parseHHmm(state.mealSchedules[slot], now);
    const windowEnd = new Date(scheduleTime.getTime() + REMINDER_WINDOW_MIN * 60 * 1000);
    // 窗口起点 = schedule，终点 = schedule + 90min（不再提前 90min）
    if (now >= scheduleTime && now < windowEnd) {
      const doneToday = state.mealRecords.find(
        (r) =>
          r.date === state.todayKey &&
          r.mealSlot === slot &&
          r.status === "done"
      );
      if (!doneToday) return { slot, windowEnd };
    }
  }
  return null;
}

export type UnackMissed = {
  slot: MealSlot;
  date: string;
};

export function selectUnackMissedSlot(state: {
  mealRecords: MealRecord[];
}): UnackMissed | null {
  const found = [...state.mealRecords]
    .filter((r) => r.status === "missed" && !r.acknowledged)
    .sort((a, b) => b.ts - a.ts)[0];
  if (!found) return null;
  return { slot: found.mealSlot, date: found.date };
}
