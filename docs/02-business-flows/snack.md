# 加餐

home SnackCard 常驻，随时点 → 拍照 → HP +10。**每日上限 2 次**（防作弊）。

> 状态：在 `feat/issue-3-snack-card` 分支，未合 main。

```mermaid
flowchart TD
  Home((main)/home) --> Snack{SnackCard<br/>count = filter dialogueHistory<br/>kind=snack_done && date=today}
  Snack -- 0/2 或 1/2 --> Click[router.push<br/>/(modal)/photo?snack=true]
  Snack -- 2/2 --> Disabled[disabled 灰版]
  Click --> Photo[(modal)/photo isSnack=true]
  Photo --> Guard{onConfirm 防御<br/>count >= 2?}
  Guard -- 是 --> Alert[Alert "明天再来吧"] --> Home
  Guard -- 否 --> AddSnack[addSnack<br/>store guard 再防御<br/>+addHp +10<br/>+pushDialogue snack_done]
  AddSnack --> Result[result<br/>"血量+10" 无饱腹度]
  AddSnack -. HP=100 .-> Advance[advanceStage]
  Result -- 完成 --> Home
```

## 正常
1. SnackCard 三态：0/2 / 1/2 / 2/2（最后 disabled）
2. 点卡 → photo modal（snack=true 参数）
3. 拍 → 确定 → `addSnack({photoUri})`：addHp(+10) + pushDialogue snack_done
4. **不写 mealRecord / fullnessHistory**（snack 不算正餐）
5. result：HP+10 + 跳过饱腹度评分
6. 跨日：todayKey 变 → SnackCard 自动重置 0/2

## 异常
| 异常 | 处理 |
|---|---|
| 2/2 时 UI | disabled 版没渲染 Pressable，点不开 |
| 2/2 时 deep link 绕过 | photo.tsx onConfirm 检测 count>=2 → Alert + 回 home |
| 绕过 UI 调 store | `addSnack` 内 `if (count >= 2) return` no-op |
| HP=100 | snack 也触发 advance（合理：吃东西就是 +HP）|
| YOLO 挂 | identification 不阻塞，addSnack 不依赖 |

## 状态变化
- `hp`: +10（clamp 0-100，可触发 advance）
- `dialogueHistory`: 加 `{kind:'snack_done', body, hpDelta:+10, photoUri, ts}`
- `mealRecords` / `fullnessHistory` / `todayMeals`: **不变**（关键差异）
- 计数从 dialogueHistory **现算**，无独立计数字段
- 防御 3 层：UI disabled / photo.tsx Alert / store no-op
