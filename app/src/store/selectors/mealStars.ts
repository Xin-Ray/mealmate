// 三餐进度星 + 下一顿倒计时 selectors（v0.5 NextMealCard）
//
// 配合 HomeMealStatusSlot 的"无活动 reminder + 无未 ack missed"分支：
// 显示 NextMealCard 而不是 null。
//
// 复用 reminder.ts 的 REMINDER_WINDOW_MIN（90min）作为窗口长度。
// 这里只用 windowEnd 判定（schedule + 90min）—— pre-window 阶段不算"过窗"。

import type {
  MealRecord,
  MealSchedule,
  MealSlot,
  TodayMeals,
} from "@src/types";

const WINDOW_MIN_AFTER = 90; // 跟 missedScan.ts 一致

export type MealStar = "done" | "missed" | "pending" | "half";

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

const parseHHmm = (hhmm: string, base: Date): Date => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

/**
 * 今日三餐进度星：从 todayMeals 读基础 status，再用 mealRecords 升级
 * missed → half（如果该 slot 今日有 madeUp record）。
 *
 * 状态语义（issue #3 v10）：
 *   - 'done'    全亮金星 ⭐（正常拍照打卡）
 *   - 'half'    半亮金星（missed 后补救成功，HP 净变化 0）
 *   - 'missed'  灰星（missed 未补救）
 *   - 'pending' 空心星 ☆（还没到 / 未拍）
 */
export function selectTodayMealStars(state: {
  todayMeals: TodayMeals;
  mealRecords: MealRecord[];
  todayKey: string;
}): Record<MealSlot, MealStar> {
  const stars: Record<MealSlot, MealStar> = {
    breakfast: state.todayMeals.breakfast,
    lunch: state.todayMeals.lunch,
    dinner: state.todayMeals.dinner,
  };
  // missed → half 升级：查今日是否有该 slot 的 madeUp record
  for (const slot of SLOTS) {
    if (stars[slot] === "missed") {
      const madeUp = state.mealRecords.some(
        (r) =>
          r.date === state.todayKey &&
          r.mealSlot === slot &&
          r.status === "missed" &&
          r.madeUp
      );
      if (madeUp) stars[slot] = "half";
    }
  }
  return stars;
}

/**
 * 找今日可补救的 missed slot（status=missed + 未 madeUp）。
 * 自动按 ts 倒序拿最近一条 —— 一天多个 missed 时优先补救最近的。
 * "当天 23:59" 窗口隐式：mealRecords 按 date 字段隔离，跨日后 todayKey 变，
 * 老 record 自动从 selector 视野消失。
 */
export function selectMakeUpEligibleSlot(state: {
  mealRecords: MealRecord[];
  todayKey: string;
}): MealSlot | null {
  const found = [...state.mealRecords]
    .filter(
      (r) =>
        r.date === state.todayKey && r.status === "missed" && !r.madeUp
    )
    .sort((a, b) => b.ts - a.ts)[0];
  return found?.mealSlot ?? null;
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
 * 规则（fix issue #1，2026-05-18）：
 * - 顺序扫描 [早, 午, 晚]：第一个满足 ① now < windowEnd ② todayMeals[slot] === 'pending'
 *   的 slot 即为下一顿
 *   · 跳过 done / missed —— 已完成或已错过的餐不再倒计时（之前算法只看 windowEnd
 *     不看 status，导致 14:25 看到"距离午餐 X"，午餐 12:30 已 done 仍被挑中）
 * - 三个 slot 都不满足 → 目标是明天早餐
 *
 * targetTs 用 schedule HH:MM 当日（不减 90min），最自然的"距离午餐还有 X"读感。
 */
export function selectNextMealCountdown(
  state: { mealSchedules: MealSchedule; todayMeals: TodayMeals },
  now: Date = new Date()
): NextMealCountdown {
  for (const slot of SLOTS) {
    // fix #1：已 done / missed 跳过；只看 pending 状态的餐
    if (state.todayMeals[slot] !== "pending") continue;
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
