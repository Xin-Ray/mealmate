export type MealSlot = "breakfast" | "lunch" | "dinner";

export type HpBand = "weak" | "hungry" | "recovering" | "happy";

export type Stage = 1 | 2;

export type MealLog = {
  slot: MealSlot;
  loggedAtIso: string;
  photoUri?: string;
};

export type DayState = {
  dateKey: string;
  meals: Partial<Record<MealSlot, MealLog>>;
};

export type AppState = {
  onboarded: boolean;
  mascotName: string;
  gentleMode: boolean;
  mealTimes: Record<MealSlot, string>;
  authConnected: boolean;
  hp: number;
  stage: Stage;
  today: DayState;
};
