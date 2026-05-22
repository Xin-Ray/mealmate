# 三餐拍照打卡

餐窗内 / 通知点击 → photo modal → HP +5 + 双 dialogue + 可选饱腹度。

```mermaid
flowchart TD
  Trigger[首页 MealReminderCard / 通知] --> Modal[(modal)/photo<br/>intro]
  Modal --> Pick{拍 / 相册} --> Preview[preview<br/>缩略图 + 确定]
  Preview -- 确定 --> Uploading[uploading]
  Uploading --> Yolo[POST /detect<br/>12s timeout fail-soft]
  Uploading --> Done[markMealDone<br/>+addHp +5<br/>+pushDialogue x2]
  Done --> Result[result<br/>HP+5 + chips + 鼓励]
  Done -. HP=100 .-> Advance[advanceStage<br/>→ (stage)/stage-N-end]
  Result -- 选饱腹度 --> Fullness[addFullnessRecord]
  Result -- 完成 / 重拍 --> Home((main)/home)
```

## 正常
1. home `<MealReminderCard>` 点 → `router.push('/(modal)/photo?slot=...')`
2. intro 选拍 / 相册 → preview → 确定 → uploading
3. 同步 `markMealDone(slot, {photoUri})` → addHp(+5) + 双 pushDialogue（meal_done + encourage）
4. 异步 `detectFood(imageUri)` 12s timeout，挂了 fail-soft
5. result：HP+5 弹跳 + done line + encourage line + 识别 chips（若有）
6. 选饱腹度（3/5/8）→ `addFullnessRecord`；点完成回 home

## 异常
| 异常 | 处理 |
|---|---|
| YOLO 挂 / 超时 | catch；HP/dialogue 照常；result 显示"识别服务没连上" |
| 同 slot 今日已 done | store 内部 no-op，不重复 +5 |
| 重拍（result phase） | 清 imageUri + detections 回 intro；`confirmedOnce=true` 防重复打卡 |
| HP 加到 100 | `addHp(+5)` → advanceStage → (main)/_layout 推 `(stage)/stage-N-end` |
| 相机权限拒绝 | fallback 相册 |

## 状态变化
- `todayMeals[slot]`: pending → done
- `hp`: +5（clamp 0-100）
- `mealRecords`: 加 `{status:'done', slot, ts, hpDelta:+5, photoUri}`
- `dialogueHistory`: 加 2 条（meal_done + encourage）
- 饱腹度选了：`fullnessHistory` 加 / 覆盖（每 slot/date 唯一）
- HP=100：触发 `advanceStage` —— currentStage+=1, hp=50, companionLv+=1, push pending

加餐分支（`?snack=true`）走 `addSnack` 路径，详 [snack.md](./snack.md)。
