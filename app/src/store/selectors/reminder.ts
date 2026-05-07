// 提醒卡 selectors（v0.4 hotfix）
//
// HomeMealStatusSlot 用：决定首页第二板块显示什么
// - 当前在某 mealWindow 内 + 该 slot 今日未 done → MealReminderCard
// - 否则有未 ack 的 missed slot → MealIncompleteCard
// - 否则 null（不显示）

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
    const center = parseHHmm(state.mealSchedules[slot], now);
    const windowStart = new Date(center.getTime() - REMINDER_WINDOW_MIN * 60 * 1000);
    const windowEnd = new Date(center.getTime() + REMINDER_WINDOW_MIN * 60 * 1000);
    if (now >= windowStart && now < windowEnd) {
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
