// 今日 records feed selector（PRD §11.D.2）
//
// 合并 mealRecords + fullnessHistory + dialogueHistory，按今日过滤 + 倒序时间。

import type {
  DialogueRecord,
  FullnessRecord,
  MealRecord,
} from "@src/types";

export type FeedItem =
  | {
      kind: "meal";
      key: string;
      ts: number;
      record: MealRecord;
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
      record: DialogueRecord;
    };

const dateKeyOf = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type FeedInput = {
  todayKey: string;
  fullnessHistory: FullnessRecord[];
  mealRecords: MealRecord[];
  dialogueHistory: DialogueRecord[];
};

export function buildTodayFeed(input: FeedInput): FeedItem[] {
  const { todayKey, fullnessHistory, mealRecords, dialogueHistory } = input;
  const items: FeedItem[] = [];

  // meal kind
  mealRecords
    .filter((r) => r.date === todayKey)
    .forEach((record) => {
      items.push({
        kind: "meal",
        key: `meal-${record.id}`,
        ts: record.ts,
        record,
      });
    });

  // fullness kind
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

  // dialogue kind（按 ts 落在今日）
  dialogueHistory
    .filter((r) => dateKeyOf(r.ts) === todayKey)
    .forEach((record) => {
      items.push({
        kind: "dialogue",
        key: `dlg-${record.id}`,
        ts: record.ts,
        record,
      });
    });

  // 倒序（最近的在前）
  items.sort((a, b) => b.ts - a.ts);
  return items;
}

// 全量 feed（records tab 用）：合并所有日期，按 ts 倒序
type AllFeedInput = {
  fullnessHistory: FullnessRecord[];
  mealRecords: MealRecord[];
  dialogueHistory: DialogueRecord[];
};

export function buildAllFeed(input: AllFeedInput): FeedItem[] {
  const { fullnessHistory, mealRecords, dialogueHistory } = input;
  const items: FeedItem[] = [];

  mealRecords.forEach((record) => {
    items.push({ kind: "meal", key: `meal-${record.id}`, ts: record.ts, record });
  });
  fullnessHistory.forEach((record) => {
    items.push({
      kind: "fullness",
      key: `fullness-${record.id}`,
      ts: record.recordedAt,
      record,
    });
  });
  dialogueHistory.forEach((record) => {
    items.push({ kind: "dialogue", key: `dlg-${record.id}`, ts: record.ts, record });
  });

  items.sort((a, b) => b.ts - a.ts);
  return items;
}

// 按日期分组：返回 [{ date: 'YYYY-MM-DD', data: FeedItem[] }, ...]
// date 倒序（今天在最上），同一组内 ts 倒序（与 buildAllFeed 一致）
export type FeedSection = { date: string; data: FeedItem[] };

export function sectionizeFeedByDate(items: FeedItem[]): FeedSection[] {
  const groups = new Map<string, FeedItem[]>();
  for (const item of items) {
    const date = dateKeyOf(item.ts);
    const arr = groups.get(date);
    if (arr) arr.push(item);
    else groups.set(date, [item]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, data]) => ({ date, data }));
}

// "YYYY-MM-DD" → "今天" / "昨天" / "M 月 D 日"
export function formatSectionDate(date: string, todayKey: string): string {
  if (date === todayKey) return "今天";
  const today = new Date(`${todayKey}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 1) return "昨天";
  const parts = date.split("-");
  if (parts.length === 3) return `${parseInt(parts[1], 10)} 月 ${parseInt(parts[2], 10)} 日`;
  return date;
}
