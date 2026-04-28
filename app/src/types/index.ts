// mealmate 共享类型定义

export type MealSlot = "breakfast" | "lunch" | "dinner";
export type MealStatus = "pending" | "done" | "missed";

// HP 区间标签（PRD §3.2）
export type HpBand = "weak" | "hungry" | "recovering" | "happy";

export type MealSchedule = Record<MealSlot, string>; // "HH:mm"
export type TodayMeals = Record<MealSlot, MealStatus>;

export type DialogueLine = {
  id: string;
  band: HpBand;
  slot: MealSlot | "any";
  text: string;
  // 安全级别：normal=日常陪伴，soft=温柔关心，gentle_alert=最低限度的不舍/担心
  safety: "normal" | "soft" | "gentle_alert";
};
