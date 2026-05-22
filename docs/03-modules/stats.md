## 模块名称
stats（统计 tab）

## 模块目标
让用户在体重 / 吃饱率两个指标上看 7-30 天趋势，确认努力有回报。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：weightHistory / fullnessHistory / mealRecords
- UI：`<TrendChart>`（自绘 SVG）

## 对外接口
- 路由：`/(main)/stats`
- selector：`selectFullnessTrend` / `selectWeightTrend`（`store/selectors/stats.ts`）
- store action：无（只读）

## 核心状态
- `weightHistory`：kg + date + photoUri
- `fullnessHistory`：rating 3/5/8 + slot + date
- `mealRecords`：用于算"吃饱率 = avg(rating) per day"

## 核心逻辑
- **吃饱率卡**：近 7 天每日平均 fullness（3/5/8 → 30%/60%/100%），渲染折线图
- **体重卡**（stage 2+）：近 30 天 kg 折线 + diff 标注（vs 起始体重）
- TrendChart 自绘 SVG：X 轴按**记录时间**（不是按日 evenly spaced，避免缺失日期出现空心圆圈断点）
- 时间窗切换：默认 7 天，可切 30 天

## 异常情况
| 异常 | 处理 |
|---|---|
| 0 条数据 | "等你拍第一张照片后这里会显示趋势" |
| 1 条数据 | 只渲染一个点，不画线 |
| stage 1 用户访问体重卡 | 隐藏（stage<2 不录体重） |
| 缺失日期 | X 轴按记录 ts，不补空点（[5232f20 commit](#)） |
| 极端值 | 不做异常剔除（用户数据，原样显示） |

## 注意事项
- **TrendChart 自绘** 而非用图表库 —— 控制视觉细节 + 减包大小
- 吃饱率 3/5/8 直接 mapping 到百分比避免 1-10 主观刻度
- 体重 diff vs **起始体重**（不是 vs 昨天）—— 体感更稳

## 模块不负责什么
- 录入体重 → [weight-entry.md](./weight-entry.md)
- 录入饱腹度 → [photo.md](./photo.md) result phase / [records.md](./records.md) 回补
- 周报 / 月报推送 → v1.1+
- HP 趋势 → 故意不画（HP 是当前状态，不是历史指标）
