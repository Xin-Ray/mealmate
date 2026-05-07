// mealmate Zustand store
//
// 持久化：AsyncStorage（@react-native-async-storage/async-storage）
//
// HP 标度（v0.4 §11.B 起）：**0–100**
// - 满血 ≥ 80 / 平稳 50–80 / 低血 30–50 / 濒临 < 30（详见 src/theme/hp.ts）
// - 通过餐 +HP_MEAL_PHOTO_GAIN（=5），错过餐 -HP_MEAL_MISSED_LOSS（=10）
//   gentleMode 下扣分减半
// - HP 上限 100、下限 0
// - HP=100 触发 advanceStage（仅 Stage 1→2 占位）
// - 老用户 0–15 标度数据通过 persist v1→v2 migrate 自动放大 6.67 倍

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  FullnessRecord,
  FullnessScore,
  MealSchedule,
  MealSlot,
  MealStatus,
  TodayMeals,
  WeightRecord,
} from "@src/types";

export const HP_MAX = 100;
export const HP_MEAL_PHOTO_GAIN = 5;
export const HP_MEAL_MISSED_LOSS = 10;

const DEFAULT_SCHEDULES: MealSchedule = {
  breakfast: "07:30",
  lunch: "11:30",
  dinner: "17:30",
};

const FRESH_TODAY: TodayMeals = {
  breakfast: "pending",
  lunch: "pending",
  dinner: "pending",
};

type State = {
  hp: number;
  currentStage: 1 | 2;
  companionLv: number;
  robotName: string;
  gentleMode: boolean;
  mealSchedules: MealSchedule;
  todayMeals: TodayMeals;
  todayKey: string; // YYYY-MM-DD，用于按日重置
  // 历史打卡：rollDayIfNeeded 时把上一天的 todayMeals 归档进来，给周视图用
  mealHistory: Record<string, TodayMeals>;
  // 体重历史，按 date 升序，最多保留 90 天（PRD §5.4 每日称重，stage 2 起）
  weightHistory: WeightRecord[];
  // settings: 称重时是否跳过照片（默认 false，按 PRD 强制要求拍）
  skipWeightPhoto: boolean;
  // 餐后饱腹度评分（PRD §11.D.1）
  fullnessHistory: FullnessRecord[];
  dialogueHistory: string[]; // 最近 5 条 dialogue id
  disappearWarningLastShownAt: number | null; // ms timestamp
  onboardingDone: boolean;
};

type Actions = {
  setRobotName: (n: string) => void;
  setGentleMode: (v: boolean) => void;
  setMealSchedule: (slot: MealSlot, hhmm: string) => void;
  finishOnboarding: () => void;
  rollDayIfNeeded: () => void;

  markMealDone: (slot: MealSlot) => void;
  markMealMissed: (slot: MealSlot) => void;
  advanceStage: () => void;

  pushDialogue: (id: string) => void;
  setDisappearWarningShown: () => void;
  canShowDisappearWarning: () => boolean;

  resetAll: () => Promise<void>;

  // 体重模块（stage 2）
  addWeightRecord: (input: { kg: number; photoUri: string }) => void;
  setSkipWeightPhoto: (v: boolean) => void;

  // 饱腹度（stage 1+2，§11.D.1）
  addFullnessRecord: (input: { mealSlot: MealSlot; score: FullnessScore }) => void;

  // Dev-only：bypass 业务规则的直接 setter，仅在 __DEV__ 守卫的开发者面板里调用
  __dev_setHp: (n: number) => void;
  __dev_setStage: (s: 1 | 2) => void;
  __dev_resetToday: () => void;
  __dev_clearWeightHistory: () => void;
  __dev_clearFullnessHistory: () => void;
};

const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const clampHp = (n: number) => Math.max(0, Math.min(HP_MAX, n));

const initialState: State = {
  hp: 67, // 0–100 标度，约对应老 0–15 的 10（PRD §四 阶段一初始 HP）
  currentStage: 1,
  companionLv: 1,
  robotName: "小满",
  gentleMode: false,
  mealSchedules: DEFAULT_SCHEDULES,
  todayMeals: FRESH_TODAY,
  todayKey: todayKey(),
  mealHistory: {},
  weightHistory: [],
  skipWeightPhoto: false,
  fullnessHistory: [],
  dialogueHistory: [],
  disappearWarningLastShownAt: null,
  onboardingDone: false,
};

const HISTORY_KEEP_DAYS = 30;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRobotName: (n) => set({ robotName: n.trim() || "小满" }),
      setGentleMode: (v) => set({ gentleMode: v }),
      setMealSchedule: (slot, hhmm) =>
        set((s) => ({ mealSchedules: { ...s.mealSchedules, [slot]: hhmm } })),
      finishOnboarding: () => set({ onboardingDone: true }),

      rollDayIfNeeded: () => {
        const k = todayKey();
        const s = get();
        if (k !== s.todayKey) {
          // 把昨天的 todayMeals 归档到 mealHistory，再清今天
          const archived = { ...s.mealHistory, [s.todayKey]: s.todayMeals };
          // 限制最多保留最近 HISTORY_KEEP_DAYS 天
          const keys = Object.keys(archived).sort();
          const kept =
            keys.length > HISTORY_KEEP_DAYS
              ? keys.slice(-HISTORY_KEEP_DAYS)
              : keys;
          const trimmed: Record<string, TodayMeals> = {};
          for (const key of kept) trimmed[key] = archived[key];
          set({
            todayKey: k,
            todayMeals: { ...FRESH_TODAY },
            mealHistory: trimmed,
          });
        }
      },

      markMealDone: (slot) => {
        const s = get();
        if (s.todayMeals[slot] === "done") return;
        const newHp = clampHp(s.hp + HP_MEAL_PHOTO_GAIN);
        set({
          hp: newHp,
          todayMeals: { ...s.todayMeals, [slot]: "done" },
        });
        if (newHp >= HP_MAX && s.currentStage === 1) {
          // 满 HP → 推进阶段（Stage 2 占位页）
          set({ currentStage: 2, companionLv: s.companionLv + 1 });
        }
      },

      markMealMissed: (slot) => {
        const s = get();
        if (s.todayMeals[slot] === "missed") return;
        const delta = s.gentleMode
          ? -HP_MEAL_MISSED_LOSS / 2
          : -HP_MEAL_MISSED_LOSS;
        set({
          hp: clampHp(s.hp + delta),
          todayMeals: { ...s.todayMeals, [slot]: "missed" },
        });
      },

      advanceStage: () =>
        set((s) => ({ currentStage: s.currentStage === 1 ? 2 : s.currentStage })),

      pushDialogue: (id) =>
        set((s) => ({ dialogueHistory: [id, ...s.dialogueHistory].slice(0, 5) })),

      setDisappearWarningShown: () =>
        set({ disappearWarningLastShownAt: Date.now() }),

      canShowDisappearWarning: () => {
        const t = get().disappearWarningLastShownAt;
        if (!t) return true;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        return Date.now() - t > sevenDays;
      },

      resetAll: async () => {
        set({ ...initialState, todayKey: todayKey() });
        await AsyncStorage.removeItem("mealmate-store");
      },

      addWeightRecord: ({ kg, photoUri }) => {
        const date = todayKey();
        const recordedAt = Date.now();
        set((s) => {
          const filtered = s.weightHistory.filter((r) => r.date !== date);
          const merged = [...filtered, { date, kg, photoUri, recordedAt }].sort(
            (a, b) => a.date.localeCompare(b.date)
          );
          // 最多保留 90 天，跟 mealHistory 量级一致
          const kept = merged.length > 90 ? merged.slice(-90) : merged;
          return { weightHistory: kept };
        });
      },
      setSkipWeightPhoto: (v) => set({ skipWeightPhoto: v }),

      addFullnessRecord: ({ mealSlot, score }) => {
        const date = todayKey();
        const recordedAt = Date.now();
        const id = `${date}-${mealSlot}-${recordedAt}`;
        set((s) => {
          // 同 mealSlot+date 覆盖（每餐次每天一条）
          const filtered = s.fullnessHistory.filter(
            (r) => !(r.date === date && r.mealSlot === mealSlot)
          );
          const merged = [...filtered, { id, mealSlot, date, score, recordedAt }];
          // 按 date 升序保留最近 90 天 × 3 餐 = 270 条上限
          const sorted = merged.sort((a, b) => a.recordedAt - b.recordedAt);
          const kept = sorted.length > 270 ? sorted.slice(-270) : sorted;
          return { fullnessHistory: kept };
        });
      },

      __dev_setHp: (n) => set({ hp: clampHp(n) }),
      __dev_setStage: (s) => set({ currentStage: s }),
      __dev_resetToday: () =>
        set({ todayMeals: { ...FRESH_TODAY }, todayKey: todayKey() }),
      __dev_clearWeightHistory: () => set({ weightHistory: [] }),
      __dev_clearFullnessHistory: () => set({ fullnessHistory: [] }),
    }),
    {
      name: "mealmate-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // v1 → v2: HP 0–15 → 0–100（× 100/15）
      // v2 → v3: 加 fullnessHistory 默认 []（§11.D.1）
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as State & Actions;
        }
        const ps = persistedState as Record<string, unknown>;
        if (version < 2 && typeof ps.hp === "number") {
          ps.hp = Math.max(0, Math.min(100, Math.round(ps.hp * (100 / 15))));
        }
        if (version < 3 && !Array.isArray(ps.fullnessHistory)) {
          ps.fullnessHistory = [];
        }
        return persistedState as State & Actions;
      },
    }
  )
);
