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
  DialogueRecord,
  FullnessRecord,
  FullnessScore,
  MealRecord,
  MealSchedule,
  MealSlot,
  MealStatus,
  TodayMeals,
  WeightRecord,
} from "@src/types";

export const HP_MAX = 100;
export const HP_MEAL_PHOTO_GAIN = 5;
export const HP_MEAL_MISSED_LOSS = 10;
// 各 stage 起始 HP（v0.4 hotfix#13，xin 拍板）
// stage 1: 60（6 颗爱心，鼓励起步）
// stage 2: 50（5 颗爱心，从 stage 1 advance 上来后重置）
export const HP_INITIAL_STAGE_1 = 60;
export const HP_INITIAL_STAGE_2 = 50;

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
  // 餐次记录（v0.4 §11.D.2 / §11.F）— 每次 markMeal*/missed-scan 落一条
  mealRecords: MealRecord[];
  dialogueHistory: DialogueRecord[]; // 倒序时间排序，最多 50 条
  disappearWarningLastShownAt: number | null; // ms timestamp
  onboardingDone: boolean;
};

type Actions = {
  setRobotName: (n: string) => void;
  setGentleMode: (v: boolean) => void;
  setMealSchedule: (slot: MealSlot, hhmm: string) => void;
  finishOnboarding: () => void;
  rollDayIfNeeded: () => void;

  markMealDone: (slot: MealSlot, options?: { photoUri?: string }) => void;
  markMealMissed: (slot: MealSlot) => void;
  advanceStage: () => void;

  pushDialogue: (input: Omit<DialogueRecord, "id" | "ts">) => void;
  setDisappearWarningShown: () => void;
  canShowDisappearWarning: () => boolean;

  resetAll: () => Promise<void>;

  // 体重模块（stage 2）
  addWeightRecord: (input: { kg: number; photoUri: string }) => void;
  setSkipWeightPhoto: (v: boolean) => void;

  // 标记某条 missed record 已被用户确认（home incomplete 卡 / missed modal "我知道了"）
  acknowledgeMissedMeal: (slot: MealSlot, date: string) => void;

  // 饱腹度（stage 1+2，§11.D.1）
  addFullnessRecord: (input: { mealSlot: MealSlot; score: FullnessScore }) => void;

  // Dev-only：bypass 业务规则的直接 setter，仅在 __DEV__ 守卫的开发者面板里调用
  __dev_setHp: (n: number) => void;
  __dev_setStage: (s: 1 | 2) => void;
  __dev_resetToday: () => void;
  __dev_clearWeightHistory: () => void;
  __dev_clearFullnessHistory: () => void;
  __dev_clearMealRecords: () => void;
  __dev_clearDialogueHistory: () => void;
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
  hp: HP_INITIAL_STAGE_1, // stage 1 起步 60 / 6 hearts（hotfix#13）
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
  mealRecords: [],
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

      markMealDone: (slot, options) => {
        const s = get();
        if (s.todayMeals[slot] === "done") return;
        const newHp = clampHp(s.hp + HP_MEAL_PHOTO_GAIN);
        const ts = Date.now();
        const date = s.todayKey;
        const record: MealRecord = {
          id: `meal-${date}-${slot}-${ts}`,
          date,
          mealSlot: slot,
          status: "done",
          ts,
          hpDelta: HP_MEAL_PHOTO_GAIN,
          photoUri: options?.photoUri,
        };
        set({
          hp: newHp,
          todayMeals: { ...s.todayMeals, [slot]: "done" },
          mealRecords: [...s.mealRecords, record],
        });
        if (newHp >= HP_MAX && s.currentStage === 1) {
          // 满 HP → 推进阶段（Stage 2 占位页）
          // hotfix#13：advance 时 HP 重置为 stage 2 起始值（50 / 5 hearts）
          set({
            currentStage: 2,
            companionLv: s.companionLv + 1,
            hp: HP_INITIAL_STAGE_2,
          });
        }
      },

      markMealMissed: (slot) => {
        const s = get();
        if (s.todayMeals[slot] === "missed") return;
        const delta = s.gentleMode
          ? -HP_MEAL_MISSED_LOSS / 2
          : -HP_MEAL_MISSED_LOSS;
        const ts = Date.now();
        const date = s.todayKey;
        const record: MealRecord = {
          id: `meal-${date}-${slot}-${ts}`,
          date,
          mealSlot: slot,
          status: "missed",
          ts,
          hpDelta: delta,
        };
        set({
          hp: clampHp(s.hp + delta),
          todayMeals: { ...s.todayMeals, [slot]: "missed" },
          mealRecords: [...s.mealRecords, record],
        });
      },

      advanceStage: () =>
        set((s) =>
          s.currentStage === 1
            ? { currentStage: 2, hp: HP_INITIAL_STAGE_2 }
            : { currentStage: s.currentStage }
        ),

      pushDialogue: (input) =>
        set((s) => {
          const ts = Date.now();
          const id = `dlg-${ts}-${Math.random().toString(36).slice(2, 8)}`;
          const record: DialogueRecord = { id, ts, ...input };
          // 倒序：新的在前，最多保留 50 条
          const merged = [record, ...s.dialogueHistory].slice(0, 50);
          return { dialogueHistory: merged };
        }),

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

      acknowledgeMissedMeal: (slot, date) =>
        set((s) => ({
          mealRecords: s.mealRecords.map((r) =>
            r.date === date &&
            r.mealSlot === slot &&
            r.status === "missed" &&
            !r.acknowledged
              ? { ...r, acknowledged: true }
              : r
          ),
        })),

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
      __dev_clearMealRecords: () => set({ mealRecords: [] }),
      __dev_clearDialogueHistory: () => set({ dialogueHistory: [] }),
    }),
    {
      name: "mealmate-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 6,
      // v1 → v2: HP 0–15 → 0–100（× 100/15）
      // v2 → v3: 加 fullnessHistory 默认 []（§11.D.1）
      // v3 → v4: dialogueHistory shape: string[] → DialogueRecord[]（老数据丢）；加 mealRecords []
      // v4 → v5: MealRecord 加可选 acknowledged 字段（缺失视为 false，无需主动写入；
      //          bump version 让仪表板更清晰）
      // v5 → v6: hotfix#13 起始 HP stage 1=60 / stage 2=50。老用户 hp 保留当前
      //          不动（不破坏进度），只新用户从 60 起步。version bump only。
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
        if (version < 4) {
          if (
            !Array.isArray(ps.dialogueHistory) ||
            (ps.dialogueHistory.length > 0 &&
              typeof ps.dialogueHistory[0] === "string")
          ) {
            ps.dialogueHistory = [];
          }
          if (!Array.isArray(ps.mealRecords)) {
            ps.mealRecords = [];
          }
        }
        // v4 → v5: noop（acknowledged 缺失自动 undefined → 视为未确认）
        // v5 → v6: noop（老用户 hp 保留）
        return persistedState as State & Actions;
      },
    }
  )
);
