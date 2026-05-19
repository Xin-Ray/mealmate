// 提醒卡 selectors（v0.4 hotfix；v10 起删 selectUnackMissedSlot）
//
// HomeMealStatusSlot 用：决定首页第二板块显示什么
// - 当前在某 mealWindow 内 + 该 slot 今日未 done → MealReminderCard
// - 否则今日有 missed + 未 madeUp 的 slot → MealMakeUpCard（issue #3，selector
//   走 mealStars.ts 的 selectMakeUpEligibleSlot）
// - 否则 NextMealCard
//
// 历史：v9 之前还有 selectUnackMissedSlot + MealIncompleteCard 三态，
// v10 issue #3 删了 IncompleteCard 改 MakeUpCard，IncompleteCard 那条
// "我知道了算了"的路径也下线 —— 给用户补救机会而非 ack 算了。

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

// v10 删了 selectUnackMissedSlot / UnackMissed —— 见上方注释。
// 找今日 missed + 未 madeUp 的 slot 现在用 mealStars.ts 的 selectMakeUpEligibleSlot。
