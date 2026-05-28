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
import Constants from "expo-constants";
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

// AsyncStorage namespace 按 APP_VARIANT 隔离：dev build 跟 prod build 数据互不可见。
// 来源：app.config.ts 把 process.env.APP_VARIANT 注入 extra.appVariant。
// dev → "mealmate-store-dev"；production / 缺失 → "mealmate-store"（保旧用户 namespace）。
const APP_VARIANT =
  (Constants.expoConfig?.extra as { appVariant?: string } | undefined)
    ?.appVariant ?? "production";
const STORE_KEY =
  APP_VARIANT === "dev" ? "mealmate-store-dev" : "mealmate-store";
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

export type TransitionKind = "start" | "end" | "demote";
export type TransitionRecord = { stage: number; kind: TransitionKind };

type State = {
  hp: number;
  currentStage: 1 | 2 | 3 | 4 | 5;
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
  // 阶段过渡屏已看记录（v7）：用于 stage 1 start 一次性触发判断。
  // 老用户（v6 → v7 migrate）按 currentStage 回填，避免补弹历史 modal。
  transitionsSeen: TransitionRecord[];
  // 阶段过渡待弹队列（v8）：HP 触发 advance/demote 时由 advanceStage/demoteStage 推
  // 一条 {stage, kind}。(main)/_layout consumer 取队首 push 对应 modal 然后 consume。
  // 与 transitionsSeen 关系：seen 是"已看过哪些"的幂等记录，pending 是"还要弹什么"
  // 的一次性队列。stage-1-start 走 seen；end/demote 走 pending（每次 advance/demote
  // 都重新触发一次，而不是只看一次）。
  transitionsPending: TransitionRecord[];
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

  // HP 边界统一处理：>=100 → advanceStage；<0 → demoteStage；其他 clamp+set
  addHp: (delta: number) => void;
  // 阶段降级（HP<0 触发）：stage>1 → 退到 stage-1 + hp=90；stage=1 → 不变 stage + hp=90
  // 都会推一条 {stage: 原 stage, kind: "demote"} 到 transitionsPending
  demoteStage: () => void;
  // 弹出 transitionsPending 队首（modal consumer 在 push 后立刻调用）
  consumeTransition: () => void;

  // 阶段过渡屏触发逻辑（保留：stage-1-start 走 seen / 一次性）
  markTransitionSeen: (stage: number, kind: TransitionKind) => void;
  hasSeenTransition: (stage: number, kind: TransitionKind) => boolean;

  // Dev-only：bypass 业务规则的直接 setter，仅在 __DEV__ 守卫的开发者面板里调用
  __dev_setHp: (n: number) => void;
  __dev_setStage: (s: 1 | 2 | 3 | 4 | 5) => void;
  __dev_resetToday: () => void;
  __dev_clearWeightHistory: () => void;
  __dev_clearFullnessHistory: () => void;
  __dev_clearMealRecords: () => void;
  __dev_clearDialogueHistory: () => void;
  __dev_resetTransitions: () => void;
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
  transitionsSeen: [],
  transitionsPending: [],
};

// HP 重置到 90（demote 之后）—— stage>1 退到 N-1 也用 90，stage 1 不变 stage 也用 90
const HP_RESET_ON_DEMOTE = 90;

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
        // 先把 done 状态和记录落进 store，再走 HP 边界（advance 会改 hp）
        set({
          todayMeals: { ...s.todayMeals, [slot]: "done" },
          mealRecords: [...s.mealRecords, record],
        });
        get().addHp(HP_MEAL_PHOTO_GAIN);
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
        // 先落 record + 标 missed，再走 HP 边界（demote 会改 hp + stage）
        set({
          todayMeals: { ...s.todayMeals, [slot]: "missed" },
          mealRecords: [...s.mealRecords, record],
        });
        get().addHp(delta);
      },

      addHp: (delta) => {
        const s = get();
        const unclamped = s.hp + delta;
        if (unclamped >= HP_MAX) {
          // 先 set 到上限再 advance（advance 会重置 hp 到下一阶段起始）
          set({ hp: HP_MAX });
          get().advanceStage();
        } else if (unclamped < 0) {
          // 直接 demote（demote 内部把 hp 重置到 90）
          get().demoteStage();
        } else {
          set({ hp: clampHp(unclamped) });
        }
      },

      advanceStage: () => {
        const s = get();
        if (s.currentStage >= 5) return; // 已到顶
        const oldStage = s.currentStage;
        const newStage = (oldStage + 1) as 1 | 2 | 3 | 4 | 5;
        // stage 2-5 起始 HP 都用 stage-2 init（50）
        const initHp = newStage === 2 ? HP_INITIAL_STAGE_2 : 50;
        set({
          currentStage: newStage,
          companionLv: s.companionLv + 1,
          hp: initHp,
          transitionsPending: [
            ...s.transitionsPending,
            { stage: oldStage, kind: "end" },
          ],
        });
      },

      demoteStage: () => {
        const s = get();
        const oldStage = s.currentStage;
        if (oldStage > 1) {
          const newStage = (oldStage - 1) as 1 | 2 | 3 | 4 | 5;
          set({
            currentStage: newStage,
            hp: HP_RESET_ON_DEMOTE,
            transitionsPending: [
              ...s.transitionsPending,
              { stage: oldStage, kind: "demote" },
            ],
          });
        } else {
          // stage 1：不变 stage，hp 重置到 90，弹 stage-1-demote（按 PRD §11.L 走 support tone）
          set({
            hp: HP_RESET_ON_DEMOTE,
            transitionsPending: [
              ...s.transitionsPending,
              { stage: 1, kind: "demote" },
            ],
          });
        }
        // 失败留账：往 dialogueHistory 推一条 kind='failure'，feed 里专属暖橘卡显示
        // body 含失败时所在的阶段编号；feed 渲染端会另显示"HP 已重置到 90"副标。
        // stageWhenFailed 是显式字段，便于未来按阶段聚合查询（无需从 body 解析）
        get().pushDialogue({
          kind: "failure",
          body: `阶段 ${oldStage} 失败一次`,
          stageWhenFailed: oldStage,
        });
      },

      consumeTransition: () =>
        set((s) => ({ transitionsPending: s.transitionsPending.slice(1) })),

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
        await AsyncStorage.removeItem(STORE_KEY);
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

      markTransitionSeen: (stage, kind) =>
        set((s) => {
          if (s.transitionsSeen.some((t) => t.stage === stage && t.kind === kind)) {
            return s;
          }
          return { transitionsSeen: [...s.transitionsSeen, { stage, kind }] };
        }),
      hasSeenTransition: (stage, kind) =>
        get().transitionsSeen.some((t) => t.stage === stage && t.kind === kind),

      __dev_setHp: (n) => set({ hp: clampHp(n) }),
      __dev_setStage: (s) => set({ currentStage: s }),
      __dev_resetToday: () =>
        set({ todayMeals: { ...FRESH_TODAY }, todayKey: todayKey() }),
      __dev_clearWeightHistory: () => set({ weightHistory: [] }),
      __dev_clearFullnessHistory: () => set({ fullnessHistory: [] }),
      __dev_clearMealRecords: () => set({ mealRecords: [] }),
      __dev_clearDialogueHistory: () => set({ dialogueHistory: [] }),
      __dev_resetTransitions: () => set({ transitionsSeen: [] }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: 9,
      // v1 → v2: HP 0–15 → 0–100（× 100/15）
      // v2 → v3: 加 fullnessHistory 默认 []（§11.D.1）
      // v3 → v4: dialogueHistory shape: string[] → DialogueRecord[]（老数据丢）；加 mealRecords []
      // v4 → v5: MealRecord 加可选 acknowledged 字段（缺失视为 false，无需主动写入；
      //          bump version 让仪表板更清晰）
      // v5 → v6: hotfix#13 起始 HP stage 1=60 / stage 2=50。老用户 hp 保留当前
      //          不动（不破坏进度），只新用户从 60 起步。version bump only。
      // v6 → v7: 加 transitionsSeen []（阶段过渡屏）。老用户按 currentStage 回填，
      //          避免补弹历史 stage start/end modal —— 已经进入 stage N 的用户视为
      //          已看过 stage 1..(N-1) 的 start+end 以及 stage N 的 start。
      // v7 → v8: 加 transitionsPending []（HP 边界触发的待弹队列）。删 stage{2-5}-start
      //          后 transitionsSeen 现在只用来追踪 stage-1-start；advance/demote 都
      //          走 pending 队列。已存的 transitionsSeen 不动（向后兼容，里面 end
      //          条目无害）。
      // v8 → v9: DialogueRecord 加可选 stageWhenFailed（仅 kind='failure' 用）。
      //          老 failure 记录缺 stageWhenFailed → undefined，feed 渲染仍可从 body
      //          字符串读"阶段 N 失败一次"（向后兼容）。version bump only。
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
        if (version < 7 && !Array.isArray(ps.transitionsSeen)) {
          const stage = typeof ps.currentStage === "number" ? ps.currentStage : 1;
          const seen: TransitionRecord[] = [];
          for (let i = 1; i < stage; i++) {
            seen.push({ stage: i, kind: "start" });
            seen.push({ stage: i, kind: "end" });
          }
          // 当前 stage 的 start 也视为已看（老用户已经在用 stage N，不应该被打断）
          seen.push({ stage, kind: "start" });
          ps.transitionsSeen = seen;
        }
        if (version < 8 && !Array.isArray(ps.transitionsPending)) {
          // 新字段默认空队列；老用户没有"待弹"的过渡 modal
          ps.transitionsPending = [];
        }
        // v8 → v9: noop。stageWhenFailed 是可选字段，缺失视为 undefined（feed 仍可从 body 读）
        return persistedState as State & Actions;
      },
    }
  )
);
