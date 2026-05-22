# photo（拍餐 / 加餐 modal）

- **作用**：统一拍照入口，4 phase 状态机 intro → preview → uploading → result；餐 / 加餐共用 modal
- **代码**：`app/app/(modal)/photo.tsx`；服务 `app/src/services/foodDetection.ts`
- **路由参数**：`?slot=...` 或 `?snack=true`；写 store：`markMealDone` 或 `addSnack` 二选 + `addFullnessRecord`
- **不负责**：HP 增减规则（→ store）、餐窗判定（→ reminder）、错过餐扫描（→ services/missedScan.ts）、体重照片（→ weight-entry）

详 [02-business-flows/meal-photo.md](../02-business-flows/meal-photo.md) / [snack.md](../02-business-flows/snack.md)。
