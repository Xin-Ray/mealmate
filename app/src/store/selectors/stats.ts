// 统计页 selectors（v1.1 扩展）
//
// X 轴 = 记录时间。
//
// v1.1（doc §七）：3 图表 / 3 子 tab 时间窗。
//   - weight: 读 weightHistory
//   - hp: 读 hpHistory（v11 新加，addHp 时追加；老用户从 v1.1 起累积，
//                       v1.1 前的历史无法补 — doc §十二 risk 11）
//   - stage: 读 stageHistory（v11 新加，advance/demote 时追加；migrate 给
//                             老用户回填 init + N-1 条 advance 同一 ts）

import type {
  HpHistoryEntry,
  StageHistoryEntry,
} from "@src/store/useStore";
import type { WeightRecord } from "@src/types";

export type TrendDataPoint = {
  date: string;       // YYYY-MM-DD
  value: number;
  display?: string;   // 自定义显示（如 "63.0"）
  ts?: number;        // v1.1：精确 ms 时间，stage timeline 阶梯线用
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
      ts: r.recordedAt,
    }));
}

const tsToDate = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type HpInput = { hpHistory: HpHistoryEntry[] };

export function selectHpTimeline(state: HpInput): TrendDataPoint[] {
  return [...state.hpHistory]
    .sort((a, b) => a.ts - b.ts)
    .map((r) => ({
      date: tsToDate(r.ts),
      value: r.hp,
      display: String(Math.round(r.hp)),
      ts: r.ts,
    }));
}

// v1.1 新：Stage 时间线（阶梯线）。每条 stageHistory 记录映射一个数据点；
// chart 渲染端要支持 step-after 模式才能画对（详 doc §七）
type StageInput = { stageHistory: StageHistoryEntry[] };

export function selectStageTimeline(state: StageInput): TrendDataPoint[] {
  return [...state.stageHistory]
    .sort((a, b) => a.ts - b.ts)
    .map((r) => ({
      date: tsToDate(r.ts),
      value: r.stage,
      display: `S${r.stage}`,
      ts: r.ts,
    }));
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
