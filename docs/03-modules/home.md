# home（首页 tab）

- **作用**：阶段 + HP + 下一餐 + 加餐 + 体重 + 今日记录的总枢纽，只读
- **代码**：`app/app/(main)/home.tsx`，`app/src/components/home/`（HomeStage1 / HomeStage2 / HomeMealStatusSlot / HomeRecordsSection）
- **store 字段**：`currentStage` / `hp` / `todayMeals` / `mealRecords` / `dialogueHistory` / `weightHistory`
- **不负责**：写 store（点卡跳的 modal 才写）、阶段过渡屏（layout useEffect 推）
