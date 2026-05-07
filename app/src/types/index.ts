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

// 餐后饱腹度评分（PRD §11.D.1 — v0.4 §5.3 简化为 3 选 1 离散值）
export type FullnessScore = 3 | 5 | 8;

export type FullnessRecord = {
  id: string;            // 唯一 key，feed 渲染用
  mealSlot: MealSlot;
  date: string;          // YYYY-MM-DD，同 mealSlot+date 覆盖
  score: FullnessScore;
  recordedAt: number;    // ms timestamp
};

// 餐次记录（PRD §11.D.2 + §11.F）— 每次 markMealDone/Missed 落一条
export type MealRecord = {
  id: string;
  date: string;          // YYYY-MM-DD
  mealSlot: MealSlot;
  status: "done" | "missed";
  ts: number;            // 实际打卡 / 错过判定时间
  hpDelta: number;       // 通过 +5 / 错过 -10（gentleMode -5）
  photoUri?: string;
};

// 对话记录（PRD §11.F）— 每次推送鼓励/警示话落一条；feed 倒序展示
export type DialogueKind =
  | "meal_done"   // §11.F.1 第一条："太棒了！X 看起来不错"
  | "meal_missed" // §11.F.2 第一条："你错过了一餐..."
  | "encourage"   // §11.F.1 第二条 鼓励
  | "remind"      // §11.F.2 第二条 "贵在坚持..."
  | "mock";       // v0.3 mock dialogues 池里的过渡内容

export type DialogueRecord = {
  id: string;
  ts: number;
  body: string;
  kind: DialogueKind;
  hpDelta?: number;      // 仅与 HP 联动的卡片显示 badge
  mealSlot?: MealSlot;
  photoUri?: string;
};
