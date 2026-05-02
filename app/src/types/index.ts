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

// 体重打卡记录（PRD §4.2 / §5.4）
export type WeightRecord = {
  date: string;       // YYYY-MM-DD，按日 dedupe（每天最多一条）
  kg: number;         // 体重 kg，精度 0.1
  photoUri: string;   // 体重秤照片 URI；skipWeightPhoto 开关打开时为空字符串
  recordedAt: number; // ms timestamp，给 21:00 前判定用
};
