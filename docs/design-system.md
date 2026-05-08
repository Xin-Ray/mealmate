# MealMate Design System

> 这份是 mealmate 视觉与交互的 source of truth。所有 RN 组件、Figma 设计、未来添加的页面都基于这份 tokens 实施。
> 关键词：**有机、温柔、健康、轻量、圆润、陪伴感、低对比奶油绿**。

---

## 1. Brand Tokens

```ts
export const brand = {
  name: "MealMate",
  personality: {
    keywords: ["healthy", "organic", "gentle", "companion", "encouraging"],
    visualTone: "soft organic green, warm cream background, rounded friendly UI",
  },
};
```

---

## 2. Color Tokens

### Core Palette

```ts
export const colors = {
  brand: {
    primary: "#2F7D32",
    primaryDark: "#14522A",
    primaryDeep: "#0F3F23",
    primaryLight: "#6DAA4F",
    primarySoft: "#DDECCF",
    primaryPale: "#EEF7E7",
  },

  background: {
    app: "#FFFDF6",
    warm: "#FFF9EC",
    card: "#FFFFFF",
    cardSoft: "#FFFDF8",
    greenTint: "#F5FAEF",
  },

  text: {
    primary: "#1F2A24",
    secondary: "#4B514E",
    tertiary: "#8E938D",
    inverse: "#FFFFFF",
    brand: "#14522A",
    mutedGreen: "#6D7D63",
  },

  border: {
    default: "#E5E1D5",
    softGreen: "#D7E8C8",
    activeGreen: "#9FCA85",
  },

  icon: {
    active: "#4B982E",
    inactive: "#9B9B96",
    soft: "#B8C7A8",
  },

  status: {
    success: "#4B982E",
    warning: "#E7B93F",
    danger: "#D96B5F",
    disabled: "#DDE6D4",
  },

  hp: {
    full: "#4B982E",
    high: "#6DAA4F",
    medium: "#DDBB43",
    low: "#D98B4A",
    critical: "#C95B50",
    empty: "#DDE6D4",
  },
};
```

---

## 3. Typography Tokens

UI 里的字体感觉是**圆润、清晰、偏中文 App 风格**，可以用 PingFang SC / HarmonyOS Sans / Inter。

```ts
export const typography = {
  fontFamily: {
    zh: "PingFang SC",
    fallback: "HarmonyOS Sans, Microsoft YaHei, sans-serif",
    en: "Inter",
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 36,
    display: 52,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    md: 28,
    lg: 32,
    xl: 40,
    display: 60,
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
  },
};
```

---

## 4. Semantic Text Styles

```ts
export const textStyles = {
  appTitle:    { fontSize: 52, lineHeight: 60, fontWeight: "800", color: "#2F7D32" },
  pageTitle:   { fontSize: 28, lineHeight: 36, fontWeight: "700", color: "#14522A" },
  sectionTitle:{ fontSize: 22, lineHeight: 30, fontWeight: "700", color: "#14522A" },
  cardTitle:   { fontSize: 32, lineHeight: 40, fontWeight: "800", color: "#14522A" },
  body:        { fontSize: 16, lineHeight: 24, fontWeight: "400", color: "#1F2A24" },
  bodyStrong:  { fontSize: 18, lineHeight: 28, fontWeight: "600", color: "#1F2A24" },
  caption:     { fontSize: 13, lineHeight: 18, fontWeight: "400", color: "#8E938D" },
  timer:       { fontSize: 42, lineHeight: 50, fontWeight: "800", color: "#14522A" },
  buttonLabel: { fontSize: 22, lineHeight: 28, fontWeight: "700", color: "#FFFFFF" },
};
```

---

## 5. Spacing Tokens

整体 UI 空间感比较松，卡片之间留白明显。

```ts
export const spacing = {
  0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 10: 10, 12: 12,
  16: 16, 20: 20, 24: 24, 28: 28, 32: 32,
  40: 40, 48: 48, 56: 56, 64: 64,
};
```

---

## 6. Radius Tokens

这个 UI 的核心特征就是**大圆角 + 柔和卡片**。

```ts
export const radius = {
  xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40,
  pill: 999, avatar: 999,
};

const componentRadius = {
  screenCard: 32,
  healthCard: 36,
  chatBubble: 18,
  button: 999,
  bottomTab: 28,
  image: 16,
};
```

---

## 7. Shadow Tokens

阴影不能重，应该像"浮在奶油背景上"。

```ts
export const shadows = {
  none:     { shadowOpacity: 0 },
  soft:     { shadowColor: "#2F7D32", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },  elevation: 3 },
  card:     { shadowColor: "#2F7D32", shadowOpacity: 0.1,  shadowRadius: 20, shadowOffset: { width: 0, height: 8 },  elevation: 5 },
  floating: { shadowColor: "#14522A", shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  button:   { shadowColor: "#2F7D32", shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },  elevation: 5 },
};
```

---

## 8. Component Tokens

### App Screen
```ts
export const screen = {
  backgroundColor: "#FFFDF6",
  paddingHorizontal: 24,
  paddingTop: 56,
  paddingBottom: 24,
};
```

### Top Navigation
```ts
export const topNav = {
  height: 56,
  titleColor: "#14522A",
  titleFontSize: 24,
  titleFontWeight: "700",
  sideTextFontSize: 20,
  iconSize: 26,
  paddingHorizontal: 24,
};
```

### Health Status Card
```ts
export const healthCard = {
  backgroundColor: "#F5FAEF",
  borderColor: "#D7E8C8",
  borderWidth: 1,
  borderRadius: 36,
  padding: 28,
  minHeight: 420,

  title:    { fontSize: 36, fontWeight: "800", color: "#14522A" },
  subtitle: { fontSize: 22, lineHeight: 32, color: "#1F2A24" },

  hpPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderColor: "#D7E8C8",
    borderWidth: 1,
  },
};
```

### HP / Blood Bar
```ts
export const hpBar = {
  heartSize: 28,
  heartGap: 10,
  activeColor: "#4B982E",
  inactiveColor: "#DDE6D4",

  progressHeight: 4,
  progressRadius: 999,
  progressColor: "#4B982E",
  progressBackground: "#DDE6D4",

  labelFontSize: 20,
  labelFontWeight: "600",
  labelColor: "#4B982E",
};
```

### Reminder Card
```ts
export const reminderCard = {
  backgroundColor: "#FFFDF8",
  borderColor: "#D7E8C8",
  borderWidth: 1,
  borderRadius: 32,
  padding: 24,

  avatarSize: 88,

  title:      { fontSize: 24, fontWeight: "700", color: "#14522A" },
  body:       { fontSize: 17, lineHeight: 26, color: "#333A35" },
  timerLabel: { fontSize: 16, color: "#8E938D" },
  timer:      { fontSize: 42, fontWeight: "800", color: "#14522A" },
  hint:       { fontSize: 14, color: "#8E938D" },
};
```

### Primary Button
```ts
export const button = {
  primary: {
    height: 64,
    borderRadius: 999,
    backgroundColor: "#4B982E",
    paddingHorizontal: 36,
    iconSize: 28,
    text: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  },

  secondary: {
    height: 56,
    borderRadius: 999,
    backgroundColor: "#EEF7E7",
    borderColor: "#D7E8C8",
    borderWidth: 1,
    text: { fontSize: 18, fontWeight: "600", color: "#14522A" },
  },
};
```

### Chat Bubble
```ts
export const chatBubble = {
  backgroundColor: "#FFFFFF",
  borderColor: "#E5E1D5",
  borderWidth: 1,
  borderRadius: 18,
  paddingHorizontal: 20,
  paddingVertical: 18,

  text:   { fontSize: 18, lineHeight: 28, color: "#1F2A24" },
  time:   { fontSize: 16, color: "#A5A5A0" },
  reward: { fontSize: 18, fontWeight: "700", color: "#4B982E" },
  imageRadius: 14,
};
```

### Choice List / 饱腹感选择
```ts
export const choiceCard = {
  container: { backgroundColor: "#FFFFFF", borderRadius: 32, padding: 24 },

  item: {
    height: 72,
    backgroundColor: "#F5FAEF",
    borderColor: "#D7E8C8",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
  },

  emojiCircle: { size: 42, backgroundColor: "#DDECCF" },
  text:        { fontSize: 18, fontWeight: "500", color: "#3C5631" },
  arrowColor:  "#4B982E",
};
```

### Bottom Tab Bar
```ts
export const bottomTab = {
  height: 86,
  backgroundColor: "#FFFFFF",
  borderTopColor: "#EFEFEA",
  borderTopWidth: 1,

  item:     { iconSize: 28, labelFontSize: 13, gap: 4 },
  active:   { color: "#4B982E", fontWeight: "600" },
  inactive: { color: "#9B9B96", fontWeight: "400" },
  indicator:{ width: 36, height: 4, borderRadius: 999, color: "#4B982E" },
};
```

---

## 9. Illustration Tokens

这部分很重要，因为 mealmate 很依赖 IP 形象。

```ts
export const illustration = {
  character: {
    style: "2D clean anime-inspired mascot",
    lineColor: "#2A211B",
    lineWidth: "medium",
    skinTone: "#FFD8B5",
    hairColor: "#161A18",
    outfitPrimary: "#06451F",
    outfitSecondary: "#F7F1DF",
    accentGreen: "#6DAA4F",
  },

  mood: {
    fullHp:   { expression: "smiling, energetic, confident",          posture: "fist up, upright body",        bodyShape: "healthy and active" },
    mediumHp: { expression: "slightly tired but hopeful",             posture: "relaxed, gentle encouragement", bodyShape: "normal but less energetic" },
    lowHp:    { expression: "tired, weak, still encouraging",         posture: "slouched, small gesture",      bodyShape: "thin and fragile" },
  },

  decorative: {
    leaves: "#7DBE5B",
    butterfly: "#B8D96A",
    sparkle: "#F1C94A",
    opacity: 0.7,
  },
};
```

---

## 10. Motion Tokens

适合之后做 onboarding / 首页动效。

```ts
export const motion = {
  duration: { fast: 160, normal: 260, slow: 420, breathing: 1800 },

  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    gentle:   "cubic-bezier(0.34, 1.56, 0.64, 1)",
    exit:     "cubic-bezier(0.4, 0, 1, 1)",
  },

  character: { breathingScale: 1.025, floatingY: 6, blinkInterval: 3200 },
  leaf:      { driftDistance: 12, rotation: 8, opacityRange: [0.4, 0.8] },
  butterfly: { wingFlapSpeed: 240, path: "soft curved organic path", floatingDistance: 20 },
};
```

---

## 11. Figma Variables Naming

你可以在 Figma 里这样建：

```txt
color/brand/primary
color/brand/primary-dark
color/brand/primary-light
color/background/app
color/background/card
color/background/green-tint
color/text/primary
color/text/secondary
color/text/brand
color/border/soft-green
color/icon/active
color/icon/inactive
color/hp/full
color/hp/empty

radius/card
radius/button
radius/avatar
radius/bottom-tab

spacing/4
spacing/8
spacing/12
spacing/16
spacing/24
spacing/32

font/size/body
font/size/title
font/size/display
font/weight/regular
font/weight/bold
```

---

## 12. React Native Theme Export

最终整合：

```ts
export const mealMateTheme = {
  colors,
  typography,
  textStyles,
  spacing,
  radius,
  shadows,
  screen,
  topNav,
  healthCard,
  hpBar,
  reminderCard,
  button,
  chatBubble,
  choiceCard,
  bottomTab,
  illustration,
  motion,
};
```

---

## 13. 核心设计规则

给 Claude Code / Cursor / v0 用的时候，可以加这一段作为 UI 生成规则：

```txt
MealMate uses a warm organic green design system.
The interface should feel healthy, soft, rounded, and emotionally supportive.

Use warm cream backgrounds instead of pure white.
Use deep green for titles, primary actions, and active states.
Use large rounded cards with subtle green borders and soft shadows.
Avoid sharp corners, cold grays, saturated neon colors, and dense layouts.
All components should feel spacious, breathable, and friendly.

The mascot is a 2D clean anime-inspired healthy food companion.
Its mood and body state should visually respond to the user's HP / blood value.
Full HP means energetic and smiling.
Low HP means weak, thin, tired, but still encouraging.

Use leaf, butterfly, sparkle, and soft organic shapes as decorative elements.
Motion should be slow, gentle, breathing-like, and emotionally warm.
```

---

## 设计核心三件事

**深绿主色 + 奶油背景 + 超圆润卡片。**

后面再做页面的时候不要乱加蓝色、紫色、玻璃拟态、强阴影，不然 MealMate 的"健康饮食伙伴"气质会散掉。
