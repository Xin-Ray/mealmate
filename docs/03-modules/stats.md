# stats（统计 tab）

- **作用**：近 7-30 天吃饱率 + 体重趋势，自绘 SVG 折线
- **代码**：`app/app/(main)/stats.tsx`，`app/src/components/ui/TrendChart.tsx`，`app/src/store/selectors/stats.ts`
- **store 字段**：`weightHistory` / `fullnessHistory` / `mealRecords`；只读
- **不负责**：录入体重 / 饱腹度（→ weight-entry / photo）、HP 趋势（HP 是当前状态不画历史）、周报月报（v1.1+）
