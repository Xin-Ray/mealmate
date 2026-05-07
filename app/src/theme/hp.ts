// HP band 阈值 + 文案 + mascot 资源（v0.4 §11.B 最终版）
//
// HP 标度自 store v2 起统一为 0–100。本模块描述 4 band 切分 + 配套资源（单一真源）。

import type { ImageSourcePropType } from "react-native";

export type HpBandKey = "full" | "stable" | "low" | "critical";

export type HpBandSpec = {
  min: number; // 闭区间
  max: number; // 闭区间
  key: HpBandKey;
  title: string;
  subtitle: string;
  hint: string;
  mascot: ImageSourcePropType;
};

// 4 档（v0.4 §11.B Figma 标注，2026-05-07 xin 拍板最终阈值 + 文案）
// 阈值 [min, max] 都是闭区间，4 档无缝覆盖 0–100 无 gap。
export const HP_BANDS: readonly HpBandSpec[] = [
  {
    min: 80, max: 100, key: "full",
    title: "精力十足", subtitle: "活力满满", hint: "认真吃好每一餐",
    mascot: require("../../assets/mascot/full.png"),
  },
  {
    min: 50, max: 79, key: "stable",
    title: "轻微疲惫", subtitle: "能量不足", hint: "需要好好补充",
    mascot: require("../../assets/mascot/stable.png"),
  },
  {
    min: 20, max: 49, key: "low",
    title: "残血状态", subtitle: "感觉不太好啊", hint: "好想吃上下一顿",
    mascot: require("../../assets/mascot/low.png"),
  },
  {
    min: 0, max: 19, key: "critical",
    title: "濒临耗尽", subtitle: "快撑不住了", hint: "吃点东西吧",
    mascot: require("../../assets/mascot/critical.png"),
  },
];

// 闭区间扫描返回当前 hp 落在的 band。
export function getHpBand(hp: number): HpBandSpec {
  const clamped = Math.max(0, Math.min(100, hp));
  for (const b of HP_BANDS) {
    if (clamped >= b.min && clamped <= b.max) return b;
  }
  return HP_BANDS[HP_BANDS.length - 1]; // 不应到达
}

// "状态不好"自然渲染阈值（§11.G）。
// 注：与 4 band 的 critical 上限 (19) 略不一致。HP_LOW_THRESHOLD 用于
// 后续 missed-check / 提醒触发等更宽阈值场景；UI 显示按 4 band 走。
// §11.K 第 7 项实施 missed-check 时再 review 是否对齐到 20（含 critical）。
export const HP_LOW_THRESHOLD = 30;

// 计算 HP 心形条填充：返回每颗心的填充比例 [0..1]，10 颗
// 1 颗 = 10 HP；hp=53 → 5 满 + 1 颗 0.3 + 4 空
export const hpHeartsFill = (hp: number): number[] => {
  const clamped = Math.max(0, Math.min(100, hp));
  const fullHearts = Math.floor(clamped / 10);
  const partial = (clamped % 10) / 10;
  return Array.from({ length: 10 }, (_, i) => {
    if (i < fullHearts) return 1;
    if (i === fullHearts) return partial;
    return 0;
  });
};
