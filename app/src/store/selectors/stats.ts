// 统计页 selectors（PRD §11.E v0.4 hotfix#12 重写）
//
// X 轴改成"记录时间"——按实际录入日期分布。
//
// v0.4：
//   - weight：直接读 weightHistory（每条都有 date + recordedAt）。
//   - HP：store 没有 hpHistory（只存当前 hp），返空数组让 chart 走空态。
//
// TODO v0.5：store 加 hpHistory: { date, hp, ts }[]，每次 markMealDone /
// markMealMissed / weight reward 时落一条；selectHpTimeline 直接读它。
// 也可以从 mealHistory + 起始 HP 推断，但有累积误差，先不做。
//
// 老版 selectStageHpProgress / selectStageWeightProgress + STAGE_KEYS 已删除。

import type { WeightRecord } from "@src/types";

export type TrendDataPoint = {
  date: string;       // YYYY-MM-DD
  value: number;
  display?: string;   // 自定义显示（如 "63.0"）
};

type WeightInput = {
  weightHistory: WeightRecord[];
};

export function selectWeightTimeline(state: WeightInput): TrendDataPoint[] {
  return [...state.weightHistory]
    .sort((a, b) => a.recordedAt - b.recordedAt)
    .map((r) => ({
      date: r.date,
      value: r.kg,
      display: r.kg.toFixed(1),
    }));
}

// HP 时间序列：v0.4 暂留空（store 没 hpHistory）
// TODO v0.5：从持久化的 hpHistory 数组取，或从 mealHistory 推断
export function selectHpTimeline(): TrendDataPoint[] {
  return [];
}

// 计算 Y 轴自动刻度（5 档），适配体重 min-max 缩放
export function autoYAxis(values: number[], targetTicks = 5): number[] {
  const valid = values.filter((v) => v > 0);
  if (valid.length === 0) return [40, 50, 60, 70, 80]; // 兜底
  const min = Math.floor(Math.min(...valid) - 2);
  const max = Math.ceil(Math.max(...valid) + 2);
  const step = Math.max(1, Math.ceil((max - min) / (targetTicks - 1)));
  return Array.from({ length: targetTicks }, (_, i) => min + i * step);
}
