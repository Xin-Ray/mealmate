// Missed-meal 扫描（PRD §11.F.2）
//
// iOS 后台 JS 不能可靠跑，所以 v0.4 退化为：每次 app 激活（启动 / 从后台回前台）
// 跑一次 detectMissedSlots → 找今日已过窗末仍 status=pending 的 slot → 自动
// markMealMissed（扣 HP -10 / gentle -5）+ push 两条 dialogue 进 feed。
//
// 调用方：`app/_layout.tsx` AppState listener。
//
// 返回：本次新发现的 missed slot 数组（用于决定要不要弹 missed modal）。
// 已经 missed 的 slot 不重复触发（store action 内有 dedup）。

import {
  HP_MEAL_MISSED_LOSS,
  useStore,
} from "@src/store/useStore";
import type { MealSchedule, MealSlot, TodayMeals } from "@src/types";

const WINDOW_MIN = 90; // PRD §11.F.3

// PRD §11.F.2 第一条："你错过了一餐..."
const MISSED_LINE_BY_SLOT: Record<MealSlot, string[]> = {
  breakfast: [
    "你错过了一餐，有点饿",
    "早餐没吃，肚子咕噜咕噜",
    "今早没等到你",
  ],
  lunch: [
    "中午没等到你，有点失落",
    "你错过了一餐，有点饿",
    "午餐没吃，下半天会有点没劲",
  ],
  dinner: [
    "晚餐没吃，今天像缺了一块",
    "你错过了一餐，有点饿",
    "晚饭时间过了，我等了一会儿",
  ],
};

// PRD §11.F.2 第二条 — 按当前 stage 切语气
const REMIND_BY_STAGE: Record<1 | 2, string[]> = {
  1: [
    "坚持每天三餐才是开始呀",
    "下一顿我们一起好吗",
    "今天剩下的别再落下了",
  ],
  2: [
    "第二阶段贵在坚持，希望下一顿可以吃上饭",
    "稳定的节奏比偶尔满分重要",
    "下一餐到了别忘了我",
  ],
};

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const parseHHmm = (hhmm: string, baseDate: Date): Date => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

export function detectMissedSlots(
  schedules: MealSchedule,
  todayMeals: TodayMeals,
  now: Date = new Date()
): MealSlot[] {
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  return slots.filter((slot) => {
    if (todayMeals[slot] !== "pending") return false; // done / missed 都跳过
    const center = parseHHmm(schedules[slot], now);
    const windowEnd = new Date(center.getTime() + WINDOW_MIN * 60 * 1000);
    return now > windowEnd;
  });
}

/**
 * 跑 missed scan：扣分 + push 双消息。
 * 返回本次新发现的 missed slot 列表（调用方据此决定是否弹 modal）。
 */
export function runMissedScan(): MealSlot[] {
  const state = useStore.getState();
  if (!state.onboardingDone) return [];
  state.rollDayIfNeeded();

  const fresh = useStore.getState(); // rollDayIfNeeded 后再读
  const newMissed = detectMissedSlots(fresh.mealSchedules, fresh.todayMeals);
  if (newMissed.length === 0) return [];

  const hpLoss = fresh.gentleMode ? HP_MEAL_MISSED_LOSS / 2 : HP_MEAL_MISSED_LOSS;

  for (const slot of newMissed) {
    fresh.markMealMissed(slot);
    fresh.pushDialogue({
      kind: "meal_missed",
      body: pickRandom(MISSED_LINE_BY_SLOT[slot]),
      mealSlot: slot,
      hpDelta: -hpLoss,
    });
    fresh.pushDialogue({
      kind: "remind",
      body: pickRandom(REMIND_BY_STAGE[fresh.currentStage]),
      mealSlot: slot,
    });
  }

  return newMissed;
}
