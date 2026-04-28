// mealmate Zustand store (mock 数据 / Stage 1 UI shell)
//
// 持久化：AsyncStorage（@react-native-async-storage/async-storage）
//
// HP 规则（PRD §3.2）：
// - 0–3 虚弱 / 4–7 饿 / 8–11 恢复中 / 12–15 开心
// - markMealDone：+0.5 HP
// - markMealMissed：-1 HP（gentleMode 下 -0.5）
// - HP 上限 15、下限 0
// - HP=15 触发 advanceStage（仅 Stage 1→2 占位）

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MealSchedule, MealSlot, MealStatus, TodayMeals } from "@src/types";

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
  chatGPTLinked: boolean;
  mealSchedules: MealSchedule;
  todayMeals: TodayMeals;
  todayKey: string; // YYYY-MM-DD，用于按日重置
  dialogueHistory: string[]; // 最近 5 条 dialogue id
  disappearWarningLastShownAt: number | null; // ms timestamp
  onboardingDone: boolean;
};

type Actions = {
  setRobotName: (n: string) => void;
  setGentleMode: (v: boolean) => void;
  setChatGPTLinked: (v: boolean) => void;
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
};

const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const clampHp = (n: number) => Math.max(0, Math.min(15, n));

const initialState: State = {
  hp: 8, // 起始默认中段 — 让用户第一次进 Home 看到一个有活力的小机器人
  currentStage: 1,
  companionLv: 1,
  robotName: "小满",
  gentleMode: false,
  chatGPTLinked: false,
  mealSchedules: DEFAULT_SCHEDULES,
  todayMeals: FRESH_TODAY,
  todayKey: todayKey(),
  dialogueHistory: [],
  disappearWarningLastShownAt: null,
  onboardingDone: false,
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRobotName: (n) => set({ robotName: n.trim() || "小满" }),
      setGentleMode: (v) => set({ gentleMode: v }),
      setChatGPTLinked: (v) => set({ chatGPTLinked: v }),
      setMealSchedule: (slot, hhmm) =>
        set((s) => ({ mealSchedules: { ...s.mealSchedules, [slot]: hhmm } })),
      finishOnboarding: () => set({ onboardingDone: true }),

      rollDayIfNeeded: () => {
        const k = todayKey();
        if (k !== get().todayKey) {
          set({ todayKey: k, todayMeals: { ...FRESH_TODAY } });
        }
      },

      markMealDone: (slot) => {
        const s = get();
        if (s.todayMeals[slot] === "done") return;
        const newHp = clampHp(s.hp + 0.5);
        set({
          hp: newHp,
          todayMeals: { ...s.todayMeals, [slot]: "done" },
        });
        if (newHp >= 15 && s.currentStage === 1) {
          // 满 HP → 推进阶段（Stage 2 占位页）
          set({ currentStage: 2, companionLv: s.companionLv + 1 });
        }
      },

      markMealMissed: (slot) => {
        const s = get();
        if (s.todayMeals[slot] === "missed") return;
        const delta = s.gentleMode ? -0.5 : -1;
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
    }),
    {
      name: "mealmate-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
