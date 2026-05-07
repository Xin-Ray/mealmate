// HP 显示与 band 阈值（v0.4 §11.B / §11.G）
//
// store 内部 HP 仍是 0–15 scale（v0.3 旧规则未 migrate），但 v0.4 PRD §11
// 用 0–100 scale 描述心形条 + band 阈值。本模块做转换 + band 判定。
//
// TODO 第 7 项（餐后消息生成）：把 store 的 HP scale 真正 migrate 到 0–100，
//   届时移除 hpToDisplay 缩放，所有阈值直接用 raw HP。

export const HP_MAX_INTERNAL = 15;
export const HP_MAX_DISPLAY = 100;

export type HpBandV4 = "full" | "stable" | "poor" | "weak" | "critical";

// 0–100 scale 阈值（v0.4 §11.B）
export const HP_BAND_THRESHOLDS = {
  full: 80,      // 满血（≥ 80）
  stable: 60,    // 状态平稳 (60–79)
  poor: 40,      // 状态欠佳 (40–59)
  weak: 20,      // 非常虚弱 (20–39)
  // < 20 → critical（濒临耗尽）
} as const;

// "状态不好"页触发阈值（§11.G）
export const HP_LOW_THRESHOLD = 30;

// store 0–15 → display 0–100
export const hpToDisplay = (hp: number): number =>
  Math.round((hp / HP_MAX_INTERNAL) * HP_MAX_DISPLAY);

// 0–100 显示值 → band
export const hpBandFromDisplay = (displayHp: number): HpBandV4 => {
  if (displayHp >= HP_BAND_THRESHOLDS.full) return "full";
  if (displayHp >= HP_BAND_THRESHOLDS.stable) return "stable";
  if (displayHp >= HP_BAND_THRESHOLDS.poor) return "poor";
  if (displayHp >= HP_BAND_THRESHOLDS.weak) return "weak";
  return "critical";
};

// 简捷：直接从 store HP 拿 v0.4 band
export const hpBandFromStoreHp = (hp: number): HpBandV4 =>
  hpBandFromDisplay(hpToDisplay(hp));

// 状态大标题（§11.B step 1）
export const HP_BAND_TITLE: Record<HpBandV4, string> = {
  full: "满血状态",
  stable: "状态平稳",
  poor: "状态欠佳",
  weak: "非常虚弱",
  critical: "濒临耗尽",
};

// 状态副标 2 行（mascot 口吻，按 band 切；待 Figma 文案细化）
export const HP_BAND_SUBTITLE: Record<HpBandV4, [string, string]> = {
  full: ["活力满满", "今天也要保持哦"],
  stable: ["状态平稳", "稳稳的就很好"],
  poor: ["略感无力", "下一顿一起来吧"],
  weak: ["急需补给", "我等你回来吃饭"],
  critical: ["濒临崩溃", "拜托陪我吃一口"],
};

// 计算 HP 心形条填充：返回每颗心的填充比例 [0..1]，10 颗
export const hpHeartsFill = (hp: number): number[] => {
  const display = hpToDisplay(hp);
  const fullHearts = Math.floor(display / 10);
  const partial = (display % 10) / 10;
  return Array.from({ length: 10 }, (_, i) => {
    if (i < fullHearts) return 1;
    if (i === fullHearts) return partial;
    return 0;
  });
};
