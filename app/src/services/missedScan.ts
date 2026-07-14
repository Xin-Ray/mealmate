// Missed-meal 扫描（PRD §11.F.2）
//
// iOS 后台 JS 不能可靠跑，所以 v0.4 退化为：每次 app 激活（启动 / 从后台回前台）
// 跑一次 detectMissedSlots → 找今日已过窗末仍 status=pending 的 slot → 自动
// markMealMissed + (条件)push dialogue 进 feed。
//
// v1.2.5 build 13: 错过提醒默认关闭(missedMealRemindersEnabled = false)
//   - 仍走 markMealMissed → 落 mealRecord(status='missed') 让 WeekStrip 显示历史
//   - 不 pushDialogue(dialogueHistory 不写,records feed 不显示提醒条)
//   - 用户在 Settings 手动开关 → true 才走完整 dialogue push
//
// v1.2.5 build 11: pure encouragement —— markMealMissed 不再扣 HP/score
//   (useStore 已改); dialogue 文案全面去「错过/失落/有点饿」→ 「下一顿见/慢慢来」
//   hpDelta = 0(原 -10/-5),UI 不渲染红色血量 badge
//
// 调用方：`app/_layout.tsx` AppState listener。
//
// 返回：本次新发现的 missed slot 数组（用于决定要不要弹 missed modal）。
// 已经 missed 的 slot 不重复触发（store action 内有 dedup）。

import { useStore } from "@src/store/useStore";
import type { MealSchedule, MealSlot, TodayMeals } from "@src/types";

const WINDOW_MIN = 90; // PRD §11.F.3

// v1.2.5 build 13:全套纯鼓励 + 去「错过/漏/-」字。让用户感到「没事,我们继续」
// 而不是「我做错了」。3 slot × 5 = 15 条 池子。
const MISSED_LINE_BY_SLOT: Record<MealSlot, string[]> = {
  breakfast: [
    "今天的早餐没拍上,没关系,下一顿等你 🌱",
    "早晨的节奏慢一点,中午我们再见 ✨",
    "今天的早餐我们跳一次,记得喝点水 💧",
    "没拍上也没关系,身体感觉舒服最重要",
    "新的一天,慢慢来就好 🌿",
  ],
  lunch: [
    "今天的午餐没拍上,没关系,下一顿等你 🌱",
    "中午这一顿我们跳一次,晚餐见 ✨",
    "没拍上也没关系,记得照顾好自己",
    "今天的节奏轻一点,下一顿我们一起 💧",
    "稍后想吃点什么,随手记一下就好 🌿",
  ],
  dinner: [
    "今天的晚餐没拍上,没关系,早点休息 🌙",
    "今晚这顿我们跳一次,明天我们继续 ✨",
    "没拍上也没关系,你愿意来就在这里 🌿",
    "今天到这里也很好,身体先休息",
    "明天我们重新开始 🌱",
  ],
};

// v1.2.5 build 13:第二条暖心提示,纯支持不施压。stage 1+2 各 5 条。
const REMIND_BY_STAGE: Record<1 | 2, string[]> = {
  1: [
    "我们一起期待下一餐 ✨",
    "你愿意来,我都在",
    "下一顿吃点喜欢的吧 🌱",
    "节奏不用赶,慢慢来",
    "你今天已经做得很好了",
  ],
  2: [
    "节奏不用一直完美 🌿",
    "保持你的节奏就好",
    "下一餐到了再见",
    "今天的我们足够",
    "你愿意拍一张,我就在 ✨",
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

  // v1.2.5 build 13: 默认 false → 仍 markMealMissed(WeekStrip 用),但不 push
  // dialogue / 不让 MealIncompleteCard 显示 / **不返回 slots 给 caller**(避免
  // _layout 自动弹 MissedMealModal)。用户在 Settings 手动开才走完整流程。
  const remindersEnabled = fresh.missedMealRemindersEnabled;

  for (const slot of newMissed) {
    fresh.markMealMissed(slot);
    if (!remindersEnabled) continue; // skip dialogue push,保留 mealRecord

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

  // 关时返回 [] → _layout 不会弹 MissedMealModal。仍走 markMealMissed 不变。
  return remindersEnabled ? newMissed : [];
}
