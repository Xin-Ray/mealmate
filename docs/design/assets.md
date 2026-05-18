# Assets

## Figma 文件

主文件：MealMate Design System v0.4
（具体 Figma 链接由 xin 维护，task 暂没拿到 share URL）

### 关键 node-id 索引

| node-id | 用途 | RN 实现 |
|---|---|---|
| 1:171 | Stage 2 主页 hero | `HomeStage2.tsx` |
| 8303:15 | Stage 2 主页完整 | `HomeStage2.tsx` |
| 5:45 / 5:14 / 1:305 / 1:332 | 4 band 主形象帧 | `mascot/{full,stable,low,critical}.png` |
| 1:265 | 早餐提醒卡 | `MealReminderModal.tsx` |
| 1:79 | missed-meal 块 + records 页 | `MissedMealModal.tsx` / records |
| 1:458 | 趋势图卡 | `TrendChart.tsx` |
| 12:119 | MealReminderCard | `MealReminderCard.tsx` |
| 10:116 | MealIncompleteCard | `MealIncompleteCard.tsx` |
| 12:144 | 今日记录条目 | `TodayRecordRow.tsx` |
| 22:3 | Stage 2 心形条 | `HpHeartsContent.tsx` |
| 12:144 | 底部 tab icon 双态 | `(main)/_layout.tsx` |
| 100:977 | Stage 1 开始过渡屏 | `StageStartScreen.tsx`（模板）|
| 100:5373 | Stage 1 完成过渡屏 | `StageEndScreen.tsx`（模板）|

## 资源路径

| 路径 | 说明 |
|---|---|
| `app/assets/mascot/full.png` | HP ≥ 80 满血 mascot |
| `app/assets/mascot/stable.png` | HP 50–80 平稳 |
| `app/assets/mascot/low.png` | HP 30–50 低血 |
| `app/assets/mascot/critical.png` | HP < 30 濒临（专属 ip 子组） |
| `app/assets/mascot/reminder.png` | meal-reminder modal 用 |
| `app/assets/mascot/missed.png` | meal-missed modal 用 |
| `app/assets/hearts/heart-fill.png` × 9 | HP 心形条 |
| `app/assets/hearts/divider.png` | 心形条分隔线 |
| `app/assets/tab-icons/{home,records,stats,my}-{on,off}.png` | 底部 tab 双态 icon |
| `app/assets/images/android-icon-background.png` | Android 启动图（预留）|

## 待下载 / 未对齐

- **Stage 2-5 过渡屏 illustration**：boy + leaf / 秤 / 树 / 星 — 当前用 emoji 占位（🧒/🌿/⚖️/🌳/⭐），等 batch 下载替换 `theme.illustration` 字段。
- **Stage 1 mascot 4 band 专属图**：当前全部用 `full.png` 兜底（v0.4 留账，§11 待 xin 复核）。
- **"我的" 页 Figma frame**：xin 未提供 → v0.4 仅做了 token 化，未做像素级对齐。

## 资源使用规范

- PNG 优先（mascot / icon / 心形）；SVG 仅 stats 折线图（react-native-svg `<Path>`）。
- `Image` 组件 + `resizeMode="contain"` 是默认；asset 比例必须保留（不能裁切 mascot 头）。
- mascot 文件命名约定：`<state>.png`，state ∈ {full, stable, low, critical, reminder, missed}。
- tab icon 命名约定：`<name>-{on,off}.png`。

## 优化

- 加载策略：所有 mascot / icon 都通过 `require()` 静态导入，Metro 打 bundle 时压缩 + AssetBundle 分发。
- 暂未做：WebP 转换 / `expo-image` cache（v0.5+）。
