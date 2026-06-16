// Missed-meal 扫描（PRD §11.F.2）
//
// iOS 后台 JS 不能可靠跑，所以 v0.4 退化为：每次 app 激活（启动 / 从后台回前台）
// 跑一次 detectMissedSlots → 找今日已过窗末仍 status=pending 的 slot → 自动
// markMealMissed + push 两条 dialogue 进 feed。
//
// v1.2.5: pure encouragement —— markMealMissed 不再扣 HP/score(useStore 已改);
// 本文件 dialogue 文案也全面去惩罚化:
//   - meal_missed 文案中性鼓励(原:「错过/有点饿/失落」→ 新:「下一顿见/慢慢来」)
//   - hpDelta = 0(原 -10/-5),UI 不渲染红色血量 badge
//   - REMIND_BY_STAGE 文案改成温和提醒(原:「贵在坚持/别再落下」→ 新:「不急/明天再来」)
//
// 调用方：`app/_layout.tsx` AppState listener。
//
// 返回：本次新发现的 missed slot 数组（用于决定要不要弹 missed modal）。
// 已经 missed 的 slot 不重复触发（store action 内有 dedup）。

import { useStore } from "@src/store/useStore";
import type { MealSchedule, MealSlot, TodayMeals } from "@src/types";

const WINDOW_MIN = 90; // PRD §11.F.3

// v1.2.5: 中性鼓励文案,不让用户觉得"漏一餐 = 失败"。原 v1.2.4 文案见 git log。
const MISSED_LINE_BY_SLOT: Record<MealSlot, string[]> = {
  breakfast: [
    "这餐没赶上,下一顿见 🌱",
    "早餐过去了,慢慢来不急",
    "今早慢了一拍,没关系",
  ],
  lunch: [
    "中午没等到你,稍后吃点也好",
    "这餐过去了,补充点水分吧",
    "午餐错过了,下一顿见 🌱",
  ],
  dinner: [
    "今晚没吃也没关系,别太勉强",
    "这餐过去了,早点休息吧",
    "晚餐过了,明天继续 🌱",
  ],
};

// v1.2.5: 第二条暖心提示,只鼓励不施压。
const REMIND_BY_STAGE: Record<1 | 2, string[]> = {
  1: [
    "我们一起期待下一餐",
    "慢慢来,不急",
    "下一顿吃点喜欢的吧",
  ],
  2: [
    "节奏不用一直完美",
    "下一餐到了再见",
    "保持你的节奏就好",
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
  now: Date = new Date(),
  onboardingCompletedAt: number | null = null
): MealSlot[] {
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  return slots.filter((slot) => {
    if (todayMeals[slot] !== "pending") return false; // done / missed 都跳过
    const scheduleTime = parseHHmm(schedules[slot], now);
    const windowEnd = new Date(scheduleTime.getTime() + WINDOW_MIN * 60 * 1000);
    if (now <= windowEnd) return false;
    // Issue #7：onboarding 结束之前就已经过完的窗口不算 missed。
    // null 视为"没 onboarded 完"——理论上不会到这（runMissedScan 已早返），保守跳过。
    if (onboardingCompletedAt === null) return false;
    if (windowEnd.getTime() <= onboardingCompletedAt) return false;
    return true;
  });
}

/**
 * 跑 missed scan：扣分 + push 双消息。
 * 返回本次新发现的 missed slot 列表（调用方据此决定是否弹 modal）。
 */
export function runMissedScan(): MealSlot[] {
  const state = useStore.getState();
  if (!state.onboardingDone) return [];
  // v1.2.1: Stage 0/0.5 漏餐免疫(纯鼓励阶段,不扣 HP / 不 push missed / remind dialogues)
  // 单层 markMealMissed 内已早 return,但 runMissedScan 这里还会 push 2 条
  // dialogue,跟「漏餐没影响」基调冲突 → 在 scan 入口就短路
  if (state.currentStage < 1) return [];
  state.rollDayIfNeeded();

  const fresh = useStore.getState(); // rollDayIfNeeded 后再读
  const newMissed = detectMissedSlots(
    fresh.mealSchedules,
    fresh.todayMeals,
    new Date(),
    fresh.onboardingCompletedAt
  );
  if (newMissed.length === 0) return [];

  for (const slot of newMissed) {
    fresh.markMealMissed(slot);
    fresh.pushDialogue({
      kind: "meal_missed",
      body: pickRandom(MISSED_LINE_BY_SLOT[slot]),
      mealSlot: slot,
      hpDelta: 0, // v1.2.5: pure encouragement,无血量 badge
    });
    // REMIND_BY_STAGE 现仅有 stage 1+2 的提醒池；3-5 阶段 fallback 到 stage 2 文案
    const stageKey = (Math.min(fresh.currentStage, 2) as 1 | 2);
    fresh.pushDialogue({
      kind: "remind",
      body: pickRandom(REMIND_BY_STAGE[stageKey]),
      mealSlot: slot,
    });
  }

  return newMissed;
}
