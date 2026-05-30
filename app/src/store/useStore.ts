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
import { selectStandardWeight } from "@src/store/selectors/standardWeight";
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
// issue #3 加餐：拍照 +10 HP（addHp 内部 clamp 到 100）
export const HP_SNACK_GAIN = 10;
// issue #3 加餐每日上限（防作弊通关）：一天最多 3 次（2026-05-30 改 2→3）
export const SNACK_DAILY_LIMIT = 3;

// 把 ms timestamp 转成 YYYY-MM-DD（跟 todayKey 同格式），用于 snack count by day
const dateOf = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
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

// v11：体质字段（见 docs/v1.1-feat-stage345-stats-celebration.md §五）
export type Gender = "male" | "female" | "other";
export type Ethnicity = "asian" | "other";

// v11：stage 变化历史（advance/demote/init），Stats tab 用阶梯线
export type StageHistoryEntry = {
  ts: number;
  stage: 1 | 2 | 3 | 4 | 5;
  reason: "advance" | "demote" | "init";
};

// v11：HP 时间线，addHp 每次写一条，Stats tab "爱心变化"图表用。滑窗见 HP_HISTORY_CAP
export type HpHistoryEntry = { ts: number; hp: number };

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
  // Issue #7：onboarding 完成时刻（ms）。runMissedScan 用来判断"某餐窗结束时
  // 用户是否真的有机会吃" —— 只 mark missed 那些 windowEnd > onboardingCompletedAt
  // 的窗，避免 onboarding 完成瞬间就把当天早过的窗口判 missed 弹 modal。
  // 老用户（v9 → v10 migrate）回填 0 → 保持旧行为不破坏。
  onboardingCompletedAt: number | null;
  // 阶段过渡屏已看记录（v7）：用于 stage 1 start 一次性触发判断。
  // 老用户（v6 → v7 migrate）按 currentStage 回填，避免补弹历史 modal。
  transitionsSeen: TransitionRecord[];
  // 阶段过渡待弹队列（v8）：HP 触发 advance/demote 时由 advanceStage/demoteStage 推
  // 一条 {stage, kind}。(main)/_layout consumer 取队首 push 对应 modal 然后 consume。
  // 与 transitionsSeen 关系：seen 是"已看过哪些"的幂等记录，pending 是"还要弹什么"
  // 的一次性队列。stage-1-start 走 seen；end/demote 走 pending（每次 advance/demote
  // 都重新触发一次，而不是只看一次）。
  transitionsPending: TransitionRecord[];

  // ====== v11 新字段（doc §五） ======
  // 体质数据 — standardWeight = bmi × height_m² 输入。
  // bmi: ethnicity='asian' → 21; 其它 → 22。gender 字段加但 v1.1 不参与公式（future）。
  // 采集入口待定（OPEN-1: 候选 onboarding 加一步 / settings / stage-4-start 表单）。
  height: number | null; // cm
  gender: Gender | null;
  ethnicity: Ethnicity | null;

  // 用户自设目标体重，stage 5 ±2.5kg 区间判定用
  targetWeight: number | null; // kg

  // stage 变化时间线，每次 advance/demote 末尾 append；migrate 给老用户回填到当前 stage
  stageHistory: StageHistoryEntry[];

  // stage 5 状态机（doc §五 stage 5 星数判定）：
  // - stage5StartedAt: 进入 stage 5 的 ts；离开 stage 5 时清 null
  // - stage5Stars: 当前累计星数，初始 0；+1（每 7 天体重全在区间）/ -1（某日超 target+2.5）
  // - stage5LastStarCheck: 上次"每 7 天"判定的 ts，避免一天内多次给星
  // - 0 星 → demoteStage 回 4；60 天未 demote → advanceStage 触发 stage-5-end
  stage5StartedAt: number | null;
  stage5Stars: number;
  stage5LastStarCheck: number | null;

  // HP 时间线 — addHp 每次追加一条；滑窗 HP_HISTORY_CAP 条（约 90 天 × 5 次/天）
  hpHistory: HpHistoryEntry[];

  // ====== v12 云端同步（issue #4 #5） ======
  // 云端同步账号。signIn 后写入，signOut/账号删除时清掉。null = 未登录，
  // 走纯本地模式（仍可用，只是没有云端备份/跨设备）。
  account: { userId: string; token: string; email: string | null } | null;
  // 上次 push 成功的时间戳（ms），用于 UI 显示 "刚刚同步" 之类的提示
  lastSyncedAt: number | null;
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

  // issue #3 加餐：随时记一笔，HP +10，不写 mealRecord（不算正餐），只 push
  // dialogue kind='snack_done' 留 feed 痕迹。
  addSnack: (input?: { photoUri?: string }) => void;

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

  // v11 profile setters（onboarding profile step + Settings 健康数据 section 用）
  setHeight: (cm: number | null) => void;
  setGender: (g: Gender | null) => void;
  setEthnicity: (e: Ethnicity | null) => void;
  setTargetWeight: (kg: number | null) => void;

  // v11 internal：stage 5 星数 / 完成 / demote 判定
  // 触发位置：addWeightRecord 末尾 + AppState 'active' listener（app/_layout.tsx）
  // 不暴露给 UI 直接调（idempotent，多次调安全）
  __internal_runStage5Check: () => void;

  // v12 云端账号同步（issue #4 #5）
  signIn: (account: { userId: string; token: string; email: string | null }) => void;
  signOut: () => void;
  setLastSyncedAt: (ts: number) => void;

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
  onboardingCompletedAt: null,
  transitionsSeen: [],
  transitionsPending: [],
  // v11 新字段
  height: null,
  gender: null,
  ethnicity: null,
  targetWeight: null,
  // 新用户从 init 开始，stage 1
  stageHistory: [{ ts: Date.now(), stage: 1, reason: "init" }],
  stage5StartedAt: null,
  stage5Stars: 0,
  stage5LastStarCheck: null,
  hpHistory: [],
  // v12 云端同步（issue #4 #5）
  account: null,
  lastSyncedAt: null,
};

// HP 重置到 90（demote 之后）—— stage>1 退到 N-1 也用 90，stage 1 不变 stage 也用 90
const HP_RESET_ON_DEMOTE = 90;

const HISTORY_KEEP_DAYS = 30;

// v11：HP 历史滑窗。平均 5 次 addHp/天 × 90 天 = 450 条
export const HP_HISTORY_CAP = 500;

// v11：stage 5 机制常量（doc §二）
export const STAGE5_TARGET_BAND_KG = 2.5;
export const STAGE5_STAR_PERIOD_DAYS = 7;
export const STAGE5_COMPLETE_DAYS = 60;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRobotName: (n) => set({ robotName: n.trim() || "小满" }),
      setGentleMode: (v) => set({ gentleMode: v }),
      setMealSchedule: (slot, hhmm) =>
        set((s) => ({ mealSchedules: { ...s.mealSchedules, [slot]: hhmm } })),
      finishOnboarding: () =>
        set({ onboardingDone: true, onboardingCompletedAt: Date.now() }),

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
        // v11：HP 时间线（Stats "爱心变化"图表）。在 set 后读最终 hp（advance/demote
        // 都会改 hp），保证记录的是 settle 后的值。滑窗 HP_HISTORY_CAP 条。
        const finalHp = get().hp;
        set((cur) => {
          const next = [...cur.hpHistory, { ts: Date.now(), hp: finalHp }];
          return {
            hpHistory:
              next.length > HP_HISTORY_CAP
                ? next.slice(-HP_HISTORY_CAP)
                : next,
          };
        });
      },

      advanceStage: () => {
        const s = get();
        if (s.currentStage >= 5) return; // 已到顶
        const oldStage = s.currentStage;
        const newStage = (oldStage + 1) as 1 | 2 | 3 | 4 | 5;
        // stage 2-5 起始 HP 都用 stage-2 init（50）
        const initHp = newStage === 2 ? HP_INITIAL_STAGE_2 : 50;
        const now = Date.now();
        set({
          currentStage: newStage,
          companionLv: s.companionLv + 1,
          hp: initHp,
          transitionsPending: [
            ...s.transitionsPending,
            { stage: oldStage, kind: "end" },
          ],
          // v11：stage 变化时间线（Stats 阶梯线用）
          stageHistory: [
            ...s.stageHistory,
            { ts: now, stage: newStage, reason: "advance" },
          ],
          // v11：进入 stage 5 时初始化 stage5 状态机
          ...(newStage === 5
            ? {
                stage5StartedAt: now,
                stage5Stars: 0,
                stage5LastStarCheck: null,
              }
            : {}),
        });
      },

      demoteStage: () => {
        const s = get();
        const oldStage = s.currentStage;
        const now = Date.now();
        if (oldStage > 1) {
          const newStage = (oldStage - 1) as 1 | 2 | 3 | 4 | 5;
          set({
            currentStage: newStage,
            hp: HP_RESET_ON_DEMOTE,
            transitionsPending: [
              ...s.transitionsPending,
              { stage: oldStage, kind: "demote" },
            ],
            // v11：stage 变化时间线
            stageHistory: [
              ...s.stageHistory,
              { ts: now, stage: newStage, reason: "demote" },
            ],
            // v11：从 5 → 4 时清 stage5 状态（OPEN-3 决策：stars 清零）
            ...(oldStage === 5
              ? {
                  stage5StartedAt: null,
                  stage5Stars: 0,
                  stage5LastStarCheck: null,
                }
              : {}),
          });
        } else {
          // stage 1：不变 stage，hp 重置到 90，弹 stage-1-demote（按 PRD §11.L 走 support tone）
          set({
            hp: HP_RESET_ON_DEMOTE,
            transitionsPending: [
              ...s.transitionsPending,
              { stage: 1, kind: "demote" },
            ],
            // v11：stage 1 demote 视为留账（stage 仍 1，记一条 reason='demote'）
            stageHistory: [
              ...s.stageHistory,
              { ts: now, stage: 1, reason: "demote" },
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

        // v11 stage 4 → 5 触发：当前体重 ≥ standardWeight → advance
        const s = get();
        if (s.currentStage === 4) {
          const standard = selectStandardWeight(s);
          if (standard != null && kg >= standard) {
            get().advanceStage();
            return;
          }
        }
        // v11 stage 5 状态机：每次记录体重 → 跑一次星数判定
        if (s.currentStage === 5) {
          get().__internal_runStage5Check();
        }
      },
      setSkipWeightPhoto: (v) => set({ skipWeightPhoto: v }),

      addSnack: (input) => {
        // 每日上限守卫（issue #3 防作弊）：今日 snack_done 数 >= SNACK_DAILY_LIMIT → no-op
        // UI 应该已经 disable SnackCard，这层是兜底
        const s = get();
        const today = s.todayKey;
        const todayCount = s.dialogueHistory.filter(
          (d) => d.kind === "snack_done" && dateOf(d.ts) === today
        ).length;
        if (todayCount >= SNACK_DAILY_LIMIT) return;

        // HP +10 走 addHp 统一边界（>=100 触发 advance；不会 <0 因为是 +10）
        get().addHp(HP_SNACK_GAIN);
        // feed 留痕：dialogue kind='snack_done'，feed 渲染端识别此 kind 走加餐卡
        get().pushDialogue({
          kind: "snack_done",
          body: "加餐成功！随时拍照都算数～",
          hpDelta: HP_SNACK_GAIN,
          photoUri: input?.photoUri,
        });
      },

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

      signIn: (account) => set({ account }),
      signOut: () => set({ account: null, lastSyncedAt: null }),
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),

      __dev_setHp: (n) => set({ hp: clampHp(n) }),
      __dev_setStage: (s) => set({ currentStage: s }),
      __dev_resetToday: () =>
        set({ todayMeals: { ...FRESH_TODAY }, todayKey: todayKey() }),
      __dev_clearWeightHistory: () => set({ weightHistory: [] }),
      __dev_clearFullnessHistory: () => set({ fullnessHistory: [] }),
      __dev_clearMealRecords: () => set({ mealRecords: [] }),
      __dev_clearDialogueHistory: () => set({ dialogueHistory: [] }),
      __dev_resetTransitions: () => set({ transitionsSeen: [] }),

      // v11 profile setters
      setHeight: (cm) => set({ height: cm }),
      setGender: (g) => set({ gender: g }),
      setEthnicity: (e) => set({ ethnicity: e }),
      setTargetWeight: (kg) => set({ targetWeight: kg }),

      // v11：Stage 5 星数 / 完成 / demote 判定。doc §五 stage 5 星数判定章节。
      // 触发：addWeightRecord 末尾（每次体重更新）+ AppState 'active' 时机（app/_layout）
      // 副效果可能：set stage5Stars / demoteStage / advanceStage（完成）
      __internal_runStage5Check: () => {
        const s = get();
        if (s.currentStage !== 5) return;
        if (s.stage5StartedAt == null) return;
        if (s.targetWeight == null) return;

        const target = s.targetWeight;
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const daysSinceStart = Math.floor(
          (now - s.stage5StartedAt) / dayMs
        );

        // 1) 60 天完成：触发 stage-5-end（advanceStage 内部 stage>=5 no-op，
        //    但我们仍需要 push pending end transition + 留 stageHistory）
        if (daysSinceStart >= STAGE5_COMPLETE_DAYS) {
          set({
            transitionsPending: [
              ...s.transitionsPending,
              { stage: 5, kind: "end" },
            ],
            stageHistory: [
              ...s.stageHistory,
              { ts: now, stage: 5, reason: "advance" },
            ],
            // 完成后清 stage5 状态（防止重复触发）
            stage5StartedAt: null,
            stage5Stars: 0,
            stage5LastStarCheck: null,
          });
          return;
        }

        // 2) 今日体重超 target+2.5 → -1 星（按今日最高一条算）
        const todayWeights = s.weightHistory.filter(
          (w) => w.date === s.todayKey
        );
        const todayMax =
          todayWeights.length > 0
            ? Math.max(...todayWeights.map((w) => w.kg))
            : null;
        if (todayMax != null && todayMax > target + STAGE5_TARGET_BAND_KG) {
          const newStars = Math.max(0, s.stage5Stars - 1);
          set({ stage5Stars: newStars });
          if (newStars === 0) {
            get().demoteStage(); // 回 stage 4，stage5 状态由 demoteStage 清
          }
          return;
        }

        // 3) 每 7 天加星判定：过去 7 天 ≥ 7 条体重记录且全在区间内 → +1 星
        const lastCheck = s.stage5LastStarCheck ?? s.stage5StartedAt;
        const daysSinceLastCheck = Math.floor((now - lastCheck) / dayMs);
        if (daysSinceLastCheck >= STAGE5_STAR_PERIOD_DAYS) {
          const sevenDaysAgo = now - STAGE5_STAR_PERIOD_DAYS * dayMs;
          const weekWeights = s.weightHistory.filter(
            (w) => w.recordedAt >= sevenDaysAgo
          );
          if (weekWeights.length >= STAGE5_STAR_PERIOD_DAYS) {
            const allInRange = weekWeights.every(
              (w) =>
                w.kg >= target - STAGE5_TARGET_BAND_KG &&
                w.kg <= target + STAGE5_TARGET_BAND_KG
            );
            if (allInRange) {
              set({
                stage5Stars: s.stage5Stars + 1,
                stage5LastStarCheck: now,
              });
            }
          }
        }
      },
    }),
    {
      name: "mealmate-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 12,
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
      // v9 → v10: 加 onboardingCompletedAt（Issue #7）。已 onboardingDone 的老用户
      //          回填 0 → 任何 windowEnd>0 都通过 missedScan 守卫，保持旧行为；
      //          未 onboarded 的用户保持 null，下次 finishOnboarding 设 Date.now()。
      // v10 → v11: v1.1 stage 3/4/5 + stats 改造。新加：
      //   - height / gender / ethnicity / targetWeight  全回填 null（stage 1-3 不用）
      //   - stageHistory  根据 currentStage 回填 init + N-1 条 advance（同 ts）
      //   - stage5StartedAt / stage5Stars / stage5LastStarCheck  老用户回填 null/0/null
      //     （正在 stage 5 的老用户 StartedAt 设 Date.now()，60 天倒数从迁移时算起 —
      //      让步，因为没有真实进入 stage 5 的时间戳）
      //   - hpHistory  回填 []（从 v1.1 起累积；详 doc §十二 risk 11）
      // v11 → v12: 加 account / lastSyncedAt（云端同步，issue #4 #5）。老用户默认
      //          null（未登录），走纯本地模式跟之前没区别。settings 里点 Sign in
      //          with Apple 才进入云同步。
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
        if (version < 10 && ps.onboardingCompletedAt === undefined) {
          // 已 onboardingDone 的老用户回填 0 → 任何 windowEnd>0 都通过守卫，
          // 保持 v1.0 旧行为不破坏；未 onboarded 用户保持 null，下次 finishOnboarding 设 Date.now()
          ps.onboardingCompletedAt = ps.onboardingDone ? 0 : null;
        }
        if (version < 11) {
          // v11 新字段（doc §五）
          if (ps.height === undefined) ps.height = null;
          if (ps.gender === undefined) ps.gender = null;
          if (ps.ethnicity === undefined) ps.ethnicity = null;
          if (ps.targetWeight === undefined) ps.targetWeight = null;
          if (!Array.isArray(ps.stageHistory)) {
            const stage =
              typeof ps.currentStage === "number" ? ps.currentStage : 1;
            const now = Date.now();
            const hist: StageHistoryEntry[] = [
              { ts: now, stage: 1, reason: "init" },
            ];
            for (let s = 2; s <= stage; s++) {
              hist.push({
                ts: now,
                stage: s as 2 | 3 | 4 | 5,
                reason: "advance",
              });
            }
            ps.stageHistory = hist;
          }
          // stage 5 状态字段
          if (ps.stage5Stars === undefined) ps.stage5Stars = 0;
          if (ps.stage5LastStarCheck === undefined) ps.stage5LastStarCheck = null;
          if (ps.stage5StartedAt === undefined) {
            // 正在 stage 5 的老用户：让 60 天倒数从迁移时算起
            ps.stage5StartedAt =
              ps.currentStage === 5 ? Date.now() : null;
          }
          if (!Array.isArray(ps.hpHistory)) ps.hpHistory = [];
        }
        if (version < 12) {
          // v12 云端同步（issue #4 #5）
          if (ps.account === undefined) ps.account = null;
          if (ps.lastSyncedAt === undefined) ps.lastSyncedAt = null;
        }
        return persistedState as State & Actions;
      },
    }
  )
);
