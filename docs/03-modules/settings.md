# settings（我的 tab）

- **作用**：gentleMode / skipWeightPhoto / 三餐时间 / 伙伴名 + 数据导出 + 全部清空 + __DEV__ 面板
- **代码**：`app/app/(main)/settings.tsx`；dev actions 在 `useStore.ts` 用 `__DEV__` 守门
- **store 字段**：`settings.{gentleMode, skipWeightPhoto}` / `mealSchedules` / `userName`；写 setter + `resetAll()`
- **不负责**：餐窗业务规则（→ reminder）、HP / stage 真实业务（→ store）、推送调度本体（→ services/notifications.ts）、云同步（v1.1+）
