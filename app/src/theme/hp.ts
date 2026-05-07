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
  /** mascot PNG 实际宽高比（width/height）。critical 是 sips 裁的不等高，单独标。 */
  mascotAspect: number;
};

// 4 档（v0.4 §11.B Figma 标注，2026-05-07 xin 拍板最终阈值 + 文案）
// 阈值 [min, max] 都是闭区间，4 档无缝覆盖 0–100 无 gap。
export const HP_BANDS: readonly HpBandSpec[] = [
  {
    min: 80, max: 100, key: "full",
    title: "精力十足", subtitle: "活力满满", hint: "认真吃好每一餐",
    mascot: require("../../assets/mascot/full.png"),
    mascotAspect: 524 / 461, // Figma ip 子组
  },
  {
    min: 50, max: 79, key: "stable",
    title: "轻微疲惫", subtitle: "能量不足", hint: "需要好好补充",
    mascot: require("../../assets/mascot/stable.png"),
    mascotAspect: 524 / 461,
  },
  {
    min: 20, max: 49, key: "low",
    title: "残血状态", subtitle: "感觉不太好啊", hint: "好想吃上下一顿",
    mascot: require("../../assets/mascot/low.png"),
    mascotAspect: 524 / 461,
  },
  {
    min: 0, max: 19, key: "critical",
    title: "濒临耗尽", subtitle: "快撑不住了", hint: "吃点东西吧",
    mascot: require("../../assets/mascot/critical.png"),
    mascotAspect: 524 / 416, // Figma 1:357 专属 ip 子组（hotfix #9 替换）
  },
];

// Stage 1 文案表（v0.4 §11.C）：4 band 共用 full.png mascot（兜底，
// 等 stage 1 专属 mascot 画好再按 band 分图）。文案调性比 stage 2 更轻
// 更鼓励，stage 1 还在"先把吃饭这事做起来"阶段。
//
// ⏳ 待 xin 复核（话术由 task 拟）。
const STAGE1_BAND_COPY: Record<HpBandKey, { title: string; subtitle: string; hint: string }> = {
  full:     { title: "今天状态超棒哒", subtitle: "继续保持",   hint: "认真吃好每一餐" },
  stable:   { title: "不错哦，继续加油", subtitle: "稳步前进",   hint: "记得按时吃饭" },
  low:      { title: "需要加把劲",     subtitle: "有点掉队啦", hint: "快补一顿吧" },
  critical: { title: "不要放弃哦",     subtitle: "咱们重新出发", hint: "先吃一口看看" },
};

const STAGE1_MASCOT: ImageSourcePropType = require("../../assets/mascot/full.png");

// 闭区间扫描返回当前 hp 落在的 band；stage 默认 2（保持 stage 2 文案/mascot）。
// stage===1 时覆盖 title/subtitle/hint/mascot 为 stage 1 专属那一套。
export function getHpBand(hp: number, stage: 1 | 2 = 2): HpBandSpec {
  const clamped = Math.max(0, Math.min(100, hp));
  let base = HP_BANDS[HP_BANDS.length - 1]; // 兜底，不应到达
  for (const b of HP_BANDS) {
    if (clamped >= b.min && clamped <= b.max) {
      base = b;
      break;
    }
  }
  if (stage === 1) {
    const copy = STAGE1_BAND_COPY[base.key];
    // STAGE1_MASCOT 是 full.png（524/461），覆盖 base.mascotAspect 保持一致
    return { ...base, ...copy, mascot: STAGE1_MASCOT, mascotAspect: 524 / 461 };
  }
  return base;
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
