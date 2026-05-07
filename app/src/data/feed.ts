// 今日 records feed selector（PRD §11.D.2）
//
// 合并 mealHistory + dialogueHistory + fullnessHistory，按今日过滤 + 倒序时间。
//
// 当前数据源限制：
// - todayMeals = Record<MealSlot, 'pending'|'done'|'missed'>，无 timestamp。
//   meal 项的 ts 用 schedules[slot] 转今天 Date 近似。
// - dialogueHistory: string[]（仅 ID），无 timestamp 无 hpDelta。第 7 项升级
//   shape 后 dialogue kind 才有真数据。本项暂返回空。
// - fullnessHistory: 完整 timestamped 记录，本项可用。

import type {
  FullnessRecord,
  MealSchedule,
  MealSlot,
  MealStatus,
  TodayMeals,
} from "@src/types";

export type FeedItem =
  | {
      kind: "meal";
      key: string;       // 渲染 key
      ts: number;        // 时间戳（meal 用 schedules[slot] 转今天）
      slot: MealSlot;
      status: MealStatus; // done | missed（pending 不入 feed）
    }
  | {
      kind: "fullness";
      key: string;
      ts: number;
      record: FullnessRecord;
    }
  | {
      kind: "dialogue";
      key: string;
      ts: number;
      // TODO §11.K 第 7 项：dialogueHistory shape 升级后填具体字段
      dialogueId: string;
    };

const parseHHmmToToday = (hhmm: string, todayKey: string): number => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const [yyyy, mm, dd] = todayKey.split("-").map((x) => parseInt(x, 10));
  return new Date(yyyy, mm - 1, dd, h || 0, m || 0, 0, 0).getTime();
};

type FeedInput = {
  todayKey: string;
  todayMeals: TodayMeals;
  schedules: MealSchedule;
  fullnessHistory: FullnessRecord[];
  // dialogueHistory 暂不消费，§11.K 第 7 项接
};

export function buildTodayFeed(input: FeedInput): FeedItem[] {
  const { todayKey, todayMeals, schedules, fullnessHistory } = input;
  const items: FeedItem[] = [];

  // meal kind: 仅 done / missed 的 slot 入 feed
  (["breakfast", "lunch", "dinner"] as MealSlot[]).forEach((slot) => {
    const status = todayMeals[slot];
    if (status === "done" || status === "missed") {
      items.push({
        kind: "meal",
        key: `meal-${todayKey}-${slot}`,
        ts: parseHHmmToToday(schedules[slot], todayKey),
        slot,
        status,
      });
    }
  });

  // fullness kind: 当日所有
  fullnessHistory
    .filter((r) => r.date === todayKey)
    .forEach((record) => {
      items.push({
        kind: "fullness",
        key: `fullness-${record.id}`,
        ts: record.recordedAt,
        record,
      });
    });

  // 倒序（最近的在前）
  items.sort((a, b) => b.ts - a.ts);
  return items;
}
