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
