## 模块名称
photo（拍餐 / 加餐 modal）

## 模块目标
统一拍照入口：餐打卡 / 加餐共用一个 modal，参数切分支。intro → preview → uploading → result 四个 phase 状态机。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：`markMealDone` / `addSnack`（snack 分支）/ `addFullnessRecord` / `pushDialogue`
- `services/foodDetection.ts`：POST /detect YOLO（fail-soft）
- [02-business-flows/meal-photo.md](../02-business-flows/meal-photo.md) / [snack.md](../02-business-flows/snack.md)

## 对外接口
- 路由：`/(modal)/photo?slot=breakfast|lunch|dinner&snack=true|false`
- 参数：
  - `slot`（餐打卡时必填）
  - `snack=true`（加餐分支）
- store action：`markMealDone(slot, {photoUri})` 或 `addSnack({photoUri})` 二选

## 核心状态
- 本地 state：`phase: 'intro'|'preview'|'uploading'|'result'`
- `imageUri: string | null`
- `detections: Detection[]`
- `confirmedOnce: boolean`（重拍时防重复打卡）
- `detectError: string | null`

## 核心逻辑
- **intro**：选拍 / 相册（`pickImageWithFallback`）
- **preview**：缩略图 + 确定 / 重选
- **uploading**：detectFood 异步 + 同步 markMealDone / addSnack
- **result**：HP delta 弹跳 + done line + encourage line + 识别 chips + 饱腹度 picker（meal only，snack 跳过）
- **重拍**：清 imageUri + detections 回 intro；`confirmedOnce` 保留为 true → 下次 confirm 不再 +HP

## 异常情况
| 异常 | 处理 |
|---|---|
| YOLO 12s 超时 / 网络挂 | catch → setDetectError；HP +5 / +10 照常推；result 屏显示"识别服务没连上" |
| 同 slot 今日已 done | store 内部 no-op，不会重复 +5 |
| 加餐 2/2 时 deep link 绕过 UI | onConfirm 检测 todayCount >= 2 → Alert + 回 home |
| 相机权限拒绝 | fallback 相册；都拒绝卡 intro |
| modal 中途关闭 | imageUri 丢失，下次重选；store 状态不变（uploading 已写入则不可逆） |
| 拍照后 app 后台 → 回前台 | 图片 uri 是 cache 路径，可能失效；UI 显示损坏图不阻塞流程 |

## 注意事项
- **复用 modal**：snack=true 走 addSnack 分支，HP+10 + 跳过 fullness picker
- result HP delta 显示根据 isSnack 切 +5 / +10
- DONE_LINE_BY_SLOT 是 photo.tsx 内硬编码 3 条 / slot，ENCOURAGE_LINES 5 条
- YOLO endpoint：默认 `http://192.168.1.157:8000`，可配 `EXPO_PUBLIC_DETECT_API_BASE`

## 模块不负责什么
- HP / stage 调整 → [store.md](./store.md) 的 addHp / advanceStage
- 餐窗判定 → [reminder.md](./reminder.md)
- 错过餐扫描 → 同上
- 加餐每日上限计数 → store action `addSnack` + UI `<SnackCard>` 三层防御
- 体重照片 → [weight-entry.md](./weight-entry.md)（独立 modal）
