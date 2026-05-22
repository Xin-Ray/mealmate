# records（记录 tab）

- **作用**：按日期 group 全量条目流（餐 / 错过 / 加餐 / 体重 / dialogue / failure），删饱腹度回补 picker
- **代码**：`app/app/(main)/records.tsx`，`app/src/components/ui/{RecordCard,TodayRecordRow,EmptyRecord,FullnessRatingPicker}.tsx`
- **store 字段**：`mealRecords` / `dialogueHistory` / `fullnessHistory` / `weightHistory`；唯一写：`addFullnessRecord`（回补）
- **不负责**：删除记录（append-only）、趋势可视化（→ stats）、+HP / push dialogue（上游 modal）
