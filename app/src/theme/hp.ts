// HP band 阈值 + 文案（v0.4 §11.B）
//
// HP 标度自 store v2 起统一为 0–100。本模块只描述 band 切分，无缩放。

export type HpBandKey = "full" | "stable" | "low" | "critical";

export type HpBandSpec = {
  min: number;
  max: number;
  key: HpBandKey;
  title: string;
  subtitle: string;
  hint: string;
};

// 4 档（v0.4 §11.B Figma 标注）
export const HP_BANDS: readonly HpBandSpec[] = [
  { min: 80, max: 100, key: "full",     title: "满血状态", subtitle: "活力满满",     hint: "认真吃好每一餐" },
  { min: 50, max: 80,  key: "stable",   title: "轻微疲惫", subtitle: "能量不足",     hint: "需要好好补充" },
  { min: 30, max: 50,  key: "low",      title: "残血状态", subtitle: "感觉不太好啊", hint: "好想吃上下一顿" },
  { min: 0,  max: 30,  key: "critical", title: "濒临耗尽", subtitle: "快撑不住了",   hint: "吃点东西吧" },
] as const;

// 二分查找返回当前 hp 落在的 band。
// max 是开区间（例如 50 落在 stable 而不是 low）。100 是闭区间。
export function getHpBand(hp: number): HpBandSpec {
  const clamped = Math.max(0, Math.min(100, hp));
  for (const b of HP_BANDS) {
    if (clamped >= b.min && (clamped < b.max || (b.max === 100 && clamped === 100))) {
      return b;
    }
  }
  // 不应到达；类型守卫的兜底
  return HP_BANDS[HP_BANDS.length - 1];
}

// "状态不好"自然渲染阈值（§11.G）：critical band 上限 = 30
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
