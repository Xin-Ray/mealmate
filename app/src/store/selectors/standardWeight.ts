// v1.1 派生 selector：standardWeight = bmi × height_m²
//
// xin 拍板（doc §二 TODO-1）：
//   asian → 21（中国/东亚优化值）
//   其它 → 22（国际通用 BMI 健康值）
//   gender 字段加但 v1.1 不参与公式（future Devine 男 +2kg / 女 -1kg）
//
// 用途：
// - Stage 4 → 5 进阶判定：addWeightRecord 时检查 currentWeight ≥ standardWeight
// - Stage 4 home 圆环进度：currentWeight / standardWeight
//
// 返回 null 表示 height 未设；调用方应跳过任何依赖此值的逻辑

import type { Ethnicity } from "@src/store/useStore";

export const BMI_ASIAN = 21;
export const BMI_DEFAULT = 22;

export function selectStandardWeight(state: {
  height: number | null;
  ethnicity: Ethnicity | null;
}): number | null {
  if (state.height == null) return null;
  const heightM = state.height / 100;
  const bmi = state.ethnicity === "asian" ? BMI_ASIAN : BMI_DEFAULT;
  // 1 位小数（与 weightHistory.kg 精度一致）
  return Math.round(bmi * heightM * heightM * 10) / 10;
}
