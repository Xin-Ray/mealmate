# Interaction Spec

整理自 [PRD §5 关键交互](../product/prd.md#五关键交互) + [PRD §11.F 餐后消息生成规则](../product/prd.md#11f-餐后消息生成规则v04-核心业务规则新增)。

## 1. 三餐推送

- **触发**：onboarding 完成 + 推送权限授予后，按 `mealSchedules` 调度本地 3 条通知（早 / 午 / 晚）。
- **文案动态**：通知 body 走 `pickDialogue(band, slot)` —— HP band 决定台词调性（低 HP 更黏人 / 高 HP 更活泼）。
- **重新调度**：`mealSchedules` 或 `hp` 变化时全部 cancel + 重新 schedule（保证文案与当前状态同步）。
- **响应**：点通知 → 跳 `/(modal)/photo?slot=<slot>` 直接进拍照 flow。

## 2. 拍照打卡 flow

```
(home) MealReminderCard "去拍照" / 通知点击
  ↓
/(modal)/photo  intro phase（"拍这一餐" + 相机 / 相册）
  ↓
preview phase（缩略图 + "确定" / "重选"）
  ↓
uploading phase（loading 0.5s 模拟）
  ↓
result phase（HP +5 弹跳数字 + 鼓励台词 + 饱腹度 picker）
  ↓
home（feed 多一条"已完成 ✓"绿色 badge）
```

- **饱腹度评分**：result phase 选完后 `addFullnessRecord({ mealSlot, score })`，覆盖该日该餐已有的评分（每餐每天一条）。
- **HP 加分**：`markMealDone(slot, { photoUri })` → HP +5（clamped 0-100）。
- **阶段升级**：如果 `newHp >= 100 && currentStage === 1` → `advanceStage` → currentStage 2 + HP 重置为 50。

## 3. 错过餐 flow（v0.4 §11.F.2 自动扫描）

```
app 启动 / 前台激活
  ↓
RootLayout useEffect → runMissedScan()
  ↓
检测今日已过窗末仍未 done 的 slot
  ↓
markMealMissed(slot) → HP -10（gentleMode 则 -5）
  ↓
pushDialogue meal_missed + remind（两条消息进 feed）
  ↓
首次发现 → router.push /(modal)/meal-missed?slot=<slot>
  ↓
用户点"我知道了" → acknowledgeMissedMeal → 关 modal
```

- **dedup**：同 slot 同 date 同 status 不重复触发。
- **多 slot**：只 push 第一条 modal；剩下的已经扣分 + 进 feed，下次 active 不重复弹。
- **窗末判定**：默认每餐 60 分钟窗口（PRD §一 阶段一）。

## 4. 错过餐 首页卡片 flow

错过餐除了被 modal 触发一次，**未确认前**会在 home 一直显示 `<MealIncompleteCard>`：

```
home <HomeMealStatusSlot>
  ↓
selectActiveReminderSlot 命中（窗内未拍） → <MealReminderCard>
  ↓ 否则
selectUnackMissedSlot 命中（窗末已过 + 未 acked） → <MealIncompleteCard>
  ↓ 否则
null（首页该位置不占空间）
```

- 用户点 "我知道了" → `acknowledgeMissedMeal(slot, todayKey)` → 卡片消失。

## 5. 体重录入 flow（Stage 2 起）

```
(home, stage 2) WeightCard 点击
  ↓
/(modal)/weight-entry intro phase（"拍体重秤" / "从相册选"）
  ↓ 或 settings 开"跳过照片" → 直接 preview phase
  ↓
preview phase（图片 + 数字输入 20-250kg）
  ↓
uploading phase（loading 0.5s）
  ↓
result phase（HP +0.5 弹跳 + 大字数字 + 鼓励台词）
  ↓
home（WeightCard 更新最新数字 + diff）
```

- **数字精度**：四舍五入到 0.1 kg。
- **同日覆盖**：`addWeightRecord` 同 date 已存在 → 覆盖。
- **历史保留**：最多 90 天（PRD §5.4）。

## 6. 阶段过渡屏 flow（v0.5 feature/stage-transitions）

```
HP 累到 100 + currentStage === 1
  ↓
markMealDone 内部 advanceStage → currentStage 2 + HP=50
  ↓
(main)/_layout useEffect 检测 currentStage 变化
  ↓
push /(modal)/stage-1-end （fullScreenModal）
  ↓
用户读 → 点 "开始阶段 2"
  ↓
markTransitionSeen(1, "end") + dismiss
  ↓
useEffect 再触发：检测 stage 2 start 未看 → push /(modal)/stage-2-start
  ↓
用户读 → 点 "开始阶段 2"
  ↓
markTransitionSeen(2, "start") + dismiss
  ↓
home（stage 2）
```

- **幂等**：`transitionsSeen` 是 source of truth，重启 / kill 都不会重复或漏弹。
- **新用户首次进 home**：transitionsSeen 空 → 自动弹 stage 1 start modal。

## 7. 推送响应

- 点通知 → `Notifications.addNotificationResponseReceivedListener` → 取 `data.slot` → push photo modal。
- 后台拉起：iOS 自动唤醒 app，handler 在 RootLayout 注册。

## 8. 通用

- **退出未保存**：photo / weight-entry 在 intro 或 preview phase 点关闭 → `Alert.alert` 二次确认 "丢弃并退出"。
- **键盘适配**：weight-entry 用 `KeyboardAvoidingView` + `ScrollView` 防止键盘遮挡 CTA（v0.4 hotfix #11）。
- **gestureEnabled: false**：stage 过渡屏不允许下滑关闭，必须点 CTA。
