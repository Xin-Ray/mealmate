# 加餐流程

home 上常驻 SnackCard，用户随时点 → 拍照 → HP +10。**每日上限 2 次**（防作弊通关）。

> 状态：on `feat/issue-3-snack-card` branch，未合 main。

## 流程图

```mermaid
flowchart TD
  Home[(main)/home] --> Snack{SnackCard<br/>读 dialogueHistory<br/>filter snack_done && dateOf===todayKey}
  Snack -- count 0/2 或 1/2 --> Click[点击 → router.push<br/>/(modal)/photo?snack=true]
  Snack -- count 2/2 --> Disabled[disabled 灰版<br/>不响应点击]
  Click --> PhotoModal[(modal)/photo<br/>isSnack=true]
  PhotoModal --> Guard{onConfirm 防御<br/>count >= 2?}
  Guard -- 是 --> Alert[Alert '今日加餐已用完<br/>明天再来吧～']
  Alert --> Back[router.back]
  Guard -- 否 --> Pick[拍 / 相册]
  Pick --> Confirm[点确定]
  Confirm --> AddSnack[addSnack input?]
  AddSnack --> Check{store guard<br/>count >= 2?}
  Check -- 是 --> Noop[no-op return]
  Check -- 否 --> AddHp[addHp +10]
  AddSnack --> Dialogue[pushDialogue<br/>kind=snack_done<br/>hpDelta=+10]
  AddHp -. HP=100 .-> Advance[advanceStage]
  Confirm --> Result[result phase<br/>'血量 +10'<br/>无饱腹度评分]
  Result -- 完成 --> Home
  Home -- 跨日 todayKey 变 --> ResetCount[count 自动重置 0/2]
```

## 正常流程

1. 用户进 home → `<SnackCard>` 读 `dialogueHistory` filter `kind='snack_done' && dateOf(ts)===todayKey`，算出今日 snack count（0/1/2）
2. SnackCard 三态：
   - **0/2** → 米黄 + 🍎 + 副标"拍一张，HP +10" + 角标"今日 0/2" + → 箭头，pressable
   - **1/2** → 同上 + 副标改"再加一次，HP +10" + 角标"今日 1/2"，pressable
   - **2/2** → disabled 灰版：🍽️ + "今日加餐已用完" + 副标"明天再来" + 角标"今日 2/2"，**不渲染 Pressable**
3. 用户点 0/2 或 1/2 卡 → `router.push('/(modal)/photo', params:{snack:'true'})`
4. photo modal 标题改 "加餐 · 记录"
5. 拍照 → 点"确定" → onConfirm 防御层检查 todayCount（如果 = 2 → Alert + 回 home，不进 uploading）
6. 防御通过 → `addSnack({photoUri})`：
   - store 层再次防御 todayCount（>= 2 no-op，理论上不该到这）
   - `addHp(+10)` 走统一边界（HP 到 100 触发 advance）
   - `pushDialogue({kind:'snack_done', body:'加餐成功！随时拍照都算数～', hpDelta:+10, photoUri})`
   - **不写 mealRecord / fullnessHistory** —— snack 不算正餐
7. result phase 显示"血量 +10"弹跳 + done line "加餐成功！..." + 鼓励 + 识别 chips（如果 YOLO 返了）；**跳过饱腹度评分**（snack 不进吃饱率统计）
8. 用户点"完成" → router.back → 回 home → SnackCard 自动刷新到 1/2 或 2/2

## 异常流程

| 异常 | 处理 |
|---|---|
| **2/2 时点 SnackCard** | UI 层：disabled 版没渲染 Pressable，无 onPress 入口，物理上点不开 |
| **2/2 时 deep link 绕过 UI** `mealmate:///(modal)/photo?snack=true` | photo.tsx onConfirm 检测 todayCount >= 2 → `Alert.alert('今日加餐已用完', '明天再来吧～', [{text:'好的', onPress: router.back}])` |
| **addSnack store 调用绕过 photo 屏**（理论上不应发生）| store 层 `if (todayCount >= SNACK_DAILY_LIMIT) return` no-op 兜底 |
| **HP 加到 100** | `addHp(+10)` 触发 advance；snack 也能触发阶段进阶（合理：吃东西就是 +HP） |
| **跨日 0:00** | rollDayIfNeeded 不动 dialogueHistory（按 ts 不归档），但 todayKey 变 → SnackCard filter 重新算 count = 0 |
| **YOLO 后端挂** | snack 流不走 YOLO 关键路径（identification 是锦上添花），detectFood error 不阻塞 addSnack |

## 状态变化

```
进 home: snackCount = filter(dialogueHistory, kind='snack_done' && dateOf(ts)===todayKey)
拍 + 确定:
  hp: +10 (clamped 0-100，可触发 advance)
  dialogueHistory: 加 1 条 { kind:'snack_done', body, hpDelta:+10, photoUri, ts:now }
  mealRecords: 不变（关键差异）
  fullnessHistory: 不变（关键差异）
  todayMeals: 不变（关键差异，snack 不占 slot）
回 home: snackCount 重新算（用户看到新角标 N+1/2）
跨日: todayKey 变 → 同样的 dialogueHistory，filter 出 0 条 → snackCount=0
```

## 注意事项

- 计数从 dialogueHistory **现算**，不存独立计数字段 —— 避免数据冗余 / 状态不同步
- **跨日自动重置** 通过 todayKey 的变化（rollDayIfNeeded 维护），不需要专门 reset action
- snack 跟 meal 在 feed 渲染上区分（RecordCard / TodayRecordRow 的 `kind === 'dialogue' && record.kind === 'snack_done'` 分支）：浅米黄卡 + 🍎 icon + 绿色"血量+10" badge
- **防御 3 层**：UI（disabled）+ photo.tsx（Alert）+ store action（no-op）。任何一层失守不会改变 HP / dialogueHistory
- 文案规范 [PRD §八](../PRD.md)：温柔正向（"加餐" / "明天再来"），禁"奖励 / 失败"等强词

## 模块不负责

- 餐次打卡 —— [meal-photo.md](./meal-photo.md)
- 错过餐补救 —— 之前的 makeUp 设计已废弃
- 饱腹度评分 —— snack 跳过这步
- 体重记录 —— [weight-entry.md](./weight-entry.md)
