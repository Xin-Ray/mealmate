# 三餐拍照打卡流程

用户在餐窗内 / 通过推送通知点击进入 photo modal，拍照确认 → HP +5 + 双 dialogue + 可选饱腹度评分。

## 流程图

```mermaid
flowchart TD
  Trigger1[首页 MealReminderCard<br/>点'去拍照'] --> PhotoModal
  Trigger2[本地通知点击] --> PhotoModal
  PhotoModal[(modal)/photo<br/>intro phase] --> Pick{拍 / 相册}
  Pick -- 拍 --> Camera[相机]
  Pick -- 相册 --> Library[相册]
  Camera --> Preview[preview phase<br/>缩略图 + 确定/重选]
  Library --> Preview
  Preview -- 重选 --> Pick
  Preview -- 确定 --> Uploading[uploading phase<br/>异步识别]
  Uploading --> Yolo[POST /detect<br/>12s timeout]
  Yolo -- 200 --> Result[result phase<br/>HP+5 + 鼓励 + 识别 chips]
  Yolo -- 错 / 超时 --> ResultFail[result phase<br/>HP+5 + 鼓励 + '识别服务没连上']
  Uploading --> MarkDone[markMealDone slot<br/>+pushDialogue x2]
  MarkDone --> Result
  Result -- 选饱腹度 --> Fullness[addFullnessRecord]
  Result -- 点'完成' / '跳过先回首页' --> Home((main)/home)
  Result -- 点'重拍一张' --> ResetImg[清 imageUri + detections<br/>confirmedOnce 保留]
  ResetImg --> Pick
  MarkDone -. addHp 命中 HP=100 .-> Advance[advanceStage]
  Advance --> StageEnd[(stage)/stage-N-end]
```

## 正常流程

1. 用户在餐窗内（schedule ± 90min）+ 该 slot 未 done → home 显示 `<MealReminderCard>`
2. 点"去拍照" → `router.push('/(modal)/photo', params:{slot})`
3. **intro phase**：用户选"拍一张" / "从相册选" → `pickImageWithFallback`
4. **preview phase**：显示缩略图 + "确定" / "重选"
5. 点"确定" → **uploading phase**：异步 `detectFood(imageUri)` 调 YOLO（12s timeout）
6. **同步**调 `markMealDone(slot, {photoUri})`：
   - `addHp(+5)` 走统一边界
   - 内部 `pushDialogue({kind:'meal_done', body:DONE_LINE, hpDelta:+5, photoUri, mealSlot})`
   - 再 `pushDialogue({kind:'encourage', body:ENCOURAGE_LINE, mealSlot})`
   - `confirmedOnce=true` 防"重拍"重复打卡
7. **result phase**：显示 `血量 +5` 弹跳动画 + 食物缩略图 + done line + encourage line + 识别 chips（如果 YOLO 返了 detections）
8. 用户可选填饱腹度（3/5/8）→ `addFullnessRecord`
9. 点"完成" / "跳过先回首页" → `router.back()` 回 home

## 异常流程

| 异常 | 处理 |
|---|---|
| **YOLO 后端挂 / 12s 超时** | catch error → setDetectError；fail-soft：HP +5 + dialogue 照常推；result 屏额外显示 "识别服务没连上，餐已打卡。({error})" 提示 |
| **同 slot 今日已 done** | `markMealDone` 内部 `if (todayMeals[slot]==='done') return` no-op；用户可重拍但不会重复 +5 |
| **重拍按钮（result phase）** | 清 imageUri + detections，回 intro phase；`confirmedOnce` 保留为 true → 下次 confirm 不再 +HP / push dialogue（只更新识别结果） |
| **HP 加到 100** | `markMealDone` → `addHp(+5)` → `advanceStage`：currentStage+=1, hp=50(stage 2)/50, push `{stage: 旧, kind:'end'}` 到 transitionsPending → home `(main)/_layout` useEffect 触发 `router.replace('/(stage)/stage-N-end')` |
| **相机权限拒绝** | `pickImageWithFallback` fallback 到相册；都拒绝 → 用户卡在 intro phase |
| **modal 中途关闭** | imageUri 丢失，下次进 modal 重新选；mealRecord 状态不变 |

## 状态变化

```
进入 modal: phase: 'intro', imageUri: null, confirmedOnce: false
选图: phase: 'preview', imageUri: 'file://...'
点确定: phase: 'uploading' → 'result'
  store side:
    todayMeals[slot]: 'pending' → 'done'
    hp: +5 (clamped 0-100)
    mealRecords: 加 { status:'done', mealSlot, ts, hpDelta:+5, photoUri }
    dialogueHistory: 加 2 条（meal_done + encourage）
    （HP 满 100 时还会触发 advanceStage 改 currentStage / 重置 hp / push pending）
选饱腹度: fullnessHistory: 加 / 覆盖（每 slot/date 唯一）
点完成: router.back，state 不变
点重拍: phase: 'intro', imageUri: null, detections: []，store 不变
```

## 注意事项

- DONE_LINE_BY_SLOT 是 photo.tsx 里硬编码的文案池，每 slot 3 条；ENCOURAGE_LINES 5 条
- **加餐复用同一个 photo modal**：`?snack=true` 参数走不同分支，调 `addSnack` 而非 `markMealDone`（详 [snack.md](./snack.md)）
- result phase HP delta 显示根据 isSnack 切 +5 / +10
- YOLO 默认 endpoint `http://192.168.1.157:8000`，xin 本地 IP，可配 `EXPO_PUBLIC_DETECT_API_BASE`

## 模块不负责

- 三餐窗口判断 —— 那是 `selectActiveReminderSlot`（reminder.ts）+ HomeMealStatusSlot 的职责
- 错过餐自动扫描 —— `runMissedScan`（详 [missed-meal.md](./missed-meal.md)）
- 体重照片 —— [weight-entry.md](./weight-entry.md) 是独立 modal
- 推送通知调度 —— `services/notifications.ts` + RootLayout useEffect
