// 统计页 selectors（PRD §11.E）
//
// X 轴固定 5 个里程碑 stage：1 / 3 / 5 / 8 / 10，对应 4+1 band 名称。
// v0.4 数据稀疏 — 仅 currentStage 有数据，其他 stage 返回 null（UI 显示空心圆 +
// 提示文案"再坚持几天就能看到趋势啦~"）。
//
// TODO v0.5：persist stage history（每次 advanceStage 记 peakHp + 体重快照），
// 让 5 个点反映用户真实跨阶段进度。

import type { WeightRecord } from "@src/types";

export const STAGE_KEYS = [1, 3, 5, 8, 10] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

// X 轴标签：stage 编号下方的 band 名（按 Figma 1:458）
export const STAGE_BAND_LABEL: Record<StageKey, string> = {
  1: "濒临",
  3: "虚弱",
  5: "欠佳",
  8: "平稳",
  10: "满血",
};

export type StageHpPoint = {
  stage: StageKey;
  /** 0..10 颗爱心；null = 未到达该阶段 */
  hearts: number | null;
  label: string;
};

export type StageWeightPoint = {
  stage: StageKey;
  /** 当阶段平均体重（kg）；null = 该阶段无录入 */
  avgKg: number | null;
  label: string;
};

type HpInput = { hp: number; currentStage: 1 | 2 };

export function selectStageHpProgress(state: HpInput): StageHpPoint[] {
  return STAGE_KEYS.map((stage) => {
    let hearts: number | null = null;
    if (state.currentStage === 1) {
      if (stage === 1) hearts = Math.round(state.hp / 10);
    } else if (state.currentStage === 2) {
      if (stage === 1) hearts = 10; // 进入 stage 2 必然已经满 100 HP
      else if (stage === 3) hearts = Math.round(state.hp / 10);
    }
    return { stage, hearts, label: STAGE_BAND_LABEL[stage] };
  });
}

type WeightInput = {
  weightHistory: WeightRecord[];
  currentStage: 1 | 2;
};

export function selectStageWeightProgress(state: WeightInput): StageWeightPoint[] {
  const avg =
    state.weightHistory.length === 0
      ? null
      : Math.round(
          (state.weightHistory.reduce((sum, r) => sum + r.kg, 0) /
            state.weightHistory.length) *
            10
        ) / 10;

  return STAGE_KEYS.map((stage) => {
    // Stage 1 不录体重（PRD §4.2，体重在 stage 2 起），永远 null
    // Stage 2 数据归到 X=3 那个点（5 个 X 等距分布 1/3/5/8/10，stage 2 对应 index 1）
    let avgKg: number | null = null;
    if (state.currentStage === 2 && stage === 3) {
      avgKg = avg;
    }
    return { stage, avgKg, label: STAGE_BAND_LABEL[stage] };
  });
}

// 计算 Y 轴自动刻度（5 档），适配体重 min-max 缩放
export function autoYAxis(values: (number | null)[], targetTicks = 5): number[] {
  const valid = values.filter((v): v is number => v !== null && v > 0);
  if (valid.length === 0) return [40, 50, 60, 70, 80]; // 兜底
  const min = Math.floor(Math.min(...valid) - 2);
  const max = Math.ceil(Math.max(...valid) + 2);
  const step = Math.max(1, Math.ceil((max - min) / (targetTicks - 1)));
  return Array.from({ length: targetTicks }, (_, i) => min + i * step);
}
