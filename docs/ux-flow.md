# MealMate UX Flow

整理 v0.4（含 feature/stage-transitions 分支）全局导航 + modal 流。

```mermaid
flowchart TD
  splash([App 启动 / hydrate]) --> hasOnboarded{onboardingDone?}

  hasOnboarded -- 否 --> ob1[onboarding/eating]
  ob1 --> ob2[onboarding/schedule]
  ob2 --> ob3[onboarding/name]
  ob3 --> mainEntry

  hasOnboarded -- 是 --> mainEntry((main)/home<br/>底部 4 tab)

  %% Stage transition modals - 触发自 (main)/_layout useEffect
  mainEntry -- stage 1 start 未看 --> stage1Start[/(modal)/stage-1-start<br/>fullScreenModal/]
  stage1Start -.开始阶段 1.-> mainEntry

  mainEntry -- advanceStage 触发 --> stageEnd[/(modal)/stage-N-end<br/>fullScreenModal/]
  stageEnd -.开始阶段 N+1.-> stageStartNext[/(modal)/stage-N+1-start/]
  stageStartNext -.开始阶段 N+1.-> mainEntry

  %% Home tab interactions
  mainEntry --> homeSlot{HomeMealStatusSlot}
  homeSlot -- 窗内未拍 --> reminderCard[MealReminderCard]
  homeSlot -- 窗末未拍未 ack --> incompleteCard[MealIncompleteCard]
  homeSlot -- 已拍 / 无窗 --> 无卡((( )))

  reminderCard -- 去拍照 --> photoModal[/(modal)/photo/]
  incompleteCard -- 我知道了 --> ackMissed[/acknowledgeMissedMeal/] --> mainEntry

  %% Photo flow
  photoModal --> photoIntro[intro: 拍 / 相册]
  photoIntro --> photoPreview[preview: 缩略图 + 确定/重选]
  photoPreview --> photoUploading[uploading]
  photoUploading --> photoResult[result: HP+5 + 鼓励 + 饱腹度 picker]
  photoResult -- 关闭 --> mainEntry

  %% 通知响应
  noti([点本地通知]) --> photoModal

  %% Missed scan
  scanActive([app active / launch]) --> missedScan{{runMissedScan}}
  missedScan -- 检测到错过 --> markMissed[markMealMissed -10] --> missedModal[/(modal)/meal-missed/]
  missedModal -- 我知道了 --> mainEntry

  %% Tab navigation
  mainEntry --> records((records))
  mainEntry --> stats((stats))
  mainEntry --> my((my / settings))

  records --> fullnessPicker[顶部饱腹度 3 选 1]
  records --> feedList[feed: meal / fullness / dialogue rows]

  stats --> heartTrend[爱心趋势图]
  stats --> weightTrend[体重趋势图]

  %% Settings → weight (stage 2) → dev panel
  my -- stage=2 体重模块入口 --> weightModal[/(modal)/weight-entry/]
  weightModal --> weightIntro[intro: 拍秤 / 相册]
  weightIntro --> weightPreview[preview: 图 + kg input]
  weightPreview --> weightUploading[uploading]
  weightUploading --> weightResult[result: HP+0.5 + 数字 + 鼓励]
  weightResult -- 关闭 --> mainEntry

  my --> devPanel{__DEV__ 开发者面板}
  devPanel -- HP / Stage 切换 --> mainEntry
  devPanel -- 重置 transitions --> mainEntry
  devPanel -- 重置 onboarding --> ob1
```

## 模块说明

### Onboarding（3 步）

- `eating` → `schedule` → `name`
- 完成后 `finishOnboarding()` 设 `onboardingDone=true` → `<Redirect>` 到 `(main)/home`
- v0.3 时有第 4 屏 ChatGPT 登录，v0.4 §11.K 第 2 项删了

### Home（核心入口）

- Stage 1 / Stage 2 两套主页（按 `currentStage` 选）
  - Stage 1：周视图 + hero card + 提醒卡 + 今日记录区
  - Stage 2：hero card（无周视图）+ 体重模块 + 提醒卡 + 今日记录区
- 第二板块 `<HomeMealStatusSlot>` 三态：`<MealReminderCard>` / `<MealIncompleteCard>` / null
- 第三板块 `<HomeRecordsSection>` 与 records tab 同 selector 共享

### Tab 切换

- 4 tab：首页 / 记录 / 统计 / 我的
- 底部 tab bar 双态 icon（实心 selected / 线框 unselected）
- 切 tab 不重 mount tab 内容（默认 Tabs navigator 行为）

### Modal stack（presentation: modal）

| modal | 触发 | 关闭 | 备注 |
|---|---|---|---|
| `/(modal)/photo` | 通知点击 / 首页 "去拍照" CTA | 用户关闭 / 完成 result phase | 4 phase：intro/preview/uploading/result |
| `/(modal)/weight-entry` | Stage 2 体重模块点击 | 用户关闭 / 完成 result phase | 4 phase 同上；KeyboardAvoidingView |
| `/(modal)/meal-reminder` | 通知点击（少用，主入口走 photo） | "去拍照" / "稍后再说" | mascot reminder.png |
| `/(modal)/meal-missed` | runMissedScan 命中 | "我知道了" → ack | mascot missed.png + "-10" badge |
| `/(modal)/stage-{1..5}-{start,end}` | (main)/_layout useEffect | CTA 点击 | fullScreenModal + gestureEnabled:false（feature/stage-transitions）|

### 后台触发链

- **三餐推送**：onboardingDone + 推送权限 → schedule 3 条本地通知（按 `mealSchedules` 时间）；hp/schedule 变 → reschedule
- **missed-scan**：app launch / AppState active → runMissedScan → 检测今日已过窗末未 done → markMissed -10 + 双消息 + 弹 modal
- **stage 过渡触发**：(main)/_layout useEffect 监听 currentStage + transitionsSeen → 优先弹未看的 prev end，再弹当前 stage start（幂等）
- **rollDayIfNeeded**：根布局 mount 时跑，跨日则归档昨日 + reset 今日

### Dev panel（__DEV__ only）

settings 页底部出现。能：HP 5 档切 / Stage 1↔2 / 重置今日 / 重置 onboarding / 清各历史 / 立即触发餐次提醒 / 重置 transitions（feature/stage-transitions 分支）。

跳转目标：大部分是修 store 状态后回 home（不主动 navigate）；"重置 onboarding" 触发 `resetAll` 清全部 + 自动跳回 onboarding/eating。
