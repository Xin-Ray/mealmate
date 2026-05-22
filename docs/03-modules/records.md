## 模块名称
records（记录 tab）

## 模块目标
让用户回看历史：按日期 group 的全量条目流（拍照 / 错过 / 加餐 / 体重 / 鼓励 dialogue / 阶段失败留账）+ 删饱腹度回补 picker。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：mealRecords / dialogueHistory / fullnessHistory / weightHistory
- UI：`<RecordCard>` / `<TodayRecordRow>` / `<EmptyRecord>` / `<FullnessRatingPicker>`

## 对外接口
- 路由：`/(main)/records`
- store action：`addFullnessRecord({ slot, date, rating })`（删饱腹度回补）
- 子组件：`<RecordCard>`（统一行视图，区分 meal_done / meal_missed / snack_done / weight / encourage / failure 等 kind）

## 核心状态
- `mealRecords`：餐次条目（done / missed），按 ts 倒序
- `dialogueHistory`：包括 meal_done / meal_missed / encourage / remind / snack_done / failure / mock
- `fullnessHistory`：饱腹度评分（与 mealRecord 关联）
- `weightHistory`：体重记录

## 核心逻辑
- 合并 mealRecords + dialogueHistory + weightHistory 为统一 records list（type discriminated union）
- 按 `dateOf(ts)` group（今天 / 昨天 / 具体日期）
- 标题"记录"
- 每条 → `<RecordCard>` 按 kind 切样式（colors / icon / badge）
- meal_done 行如果没填饱腹度 → 显示 picker，点 → `addFullnessRecord`

## 异常情况
| 异常 | 处理 |
|---|---|
| 无任何记录（新用户） | `<EmptyRecord>` 占位"还没有记录" |
| meal_done 已填过饱腹度 | picker 隐藏，行只显示 photo + 文案 |
| dialogue kind=mock | 调试条目，按 dev 开关显示 / 隐藏 |
| 跨日 records | rollDayIfNeeded 维护；按 ts 排序天然分组 |
| failure dialogue（demote 留账） | 暖橘卡 + 💭 icon（区别 missed 的红 badge）|

## 注意事项
- **不删除**：记录不可删（防作弊 + 留档）
- 显示历史所有数据，不分页（v0.5 暂时全量；后续条目多了考虑虚拟列表）
- mascot 头像替代了之前的彩色 icon（[commit f94c7f9](#)）

## 模块不负责什么
- 趋势 / 周报 → [stats.md](./stats.md)
- 任何 +HP / push dialogue → 上游 modal 的责任
- HP 心 / stage 显示 → home 的责任
- 体重录入交互 → [weight-entry.md](./weight-entry.md)
