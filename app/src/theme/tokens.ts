// Design tokens — 给后续组件用 inline style 时引用的常量来源
//
// 为什么需要：tailwind/nativewind 的 className 走原子 class（如 `bg-bg`），
// 但 Animated / SVG path / inline gradient stop 等场景拿不到 className，
// 必须用 RN style 对象 / 数字色码。tokens.ts 是这些场景的真源。
//
// 与 tailwind.config.js 的关系：tailwind 仍是 className 的真源；tokens.ts
// 镜像同一组色 + 加 v0.4 Figma 引入的新色。两边手工保持一致（短期内）。
// 长期 v0.5+ 会把 tailwind config 改成从这里 import。
//
// ⚠️ 等 Figma 完整色板下来再补全（HP 心形红、倒计时数字色、状态不好页 dim 等）

export const colors = {
  bg: {
    page: "#FFF8F1",        // 主背景
    pageDim: "#F3F0E8",     // "状态不好"页背景 (§11.G)
    card: "#FFFFFF",
    hpEmpty: "#F2E2C9",
  },
  ink: {
    primary: "#3A2E22",
    sub: "#8C7A66",
    muted: "#A89684",
  },
  brand: {
    accent: "#FF8A4C",      // 现有橙（v0.1–v0.3 主 CTA）
    accentDark: "#E0723A",
    green: "#60883b",       // v0.4 Figma 主色绿（待大面积应用）
    greenDim: "#8B9A7A",    // "状态不好"页主色 (§11.G)
  },
  status: {
    ok: "#7BC47F",
    warn: "#F4A261",
    bad: "#E76F51",
  },
  border: {
    card: "#F0E2CB",
  },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  // 按 Figma 标注的字号档位（只是参考，实际仍可用 tailwind text-xs/sm/base 等）
  caption: 10,
  small: 12,
  body: 14,
  bodyL: 16,
  title: 18,
  titleL: 22,
  hero: 28,
} as const;

// HP 阈值（v0.4 §11.G "状态不好"页触发条件）
export const HP_LOW_THRESHOLD = 30;
