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

  %% Stage transition screens (v0.5 Plan B：移出 (modal) group → (stage) group 普通 page)
  %% (main)/_layout useEffect 用 router.replace 切到 (stage)，按钮再 router.replace 回 (main)/home
  mainEntry -- stage 1 start 未看<br/>router.replace --> stage1Start[/(stage)/stage-1-start<br/>page slide_from_right/]
  stage1Start -.开始阶段 1<br/>router.replace.-> mainEntry

  mainEntry -- advance 触发<br/>transitionsPending push end<br/>router.replace --> stageEnd[/(stage)/stage-N-end<br/>page slide_from_right/]
  stageEnd -.完成<br/>router.replace.-> mainEntry

  %% Demote flow - HP<0 触发
  hpNeg([HP < 0]) --> demoteStage[demoteStage<br/>HP→90<br/>stage>1: 退到 N-1<br/>stage=1: 不变 stage]
  demoteStage --> stageDemote[/(stage)/stage-N-demote<br/>page slide_from_right/]
  demoteStage --> failureRec[(pushDialogue<br/>kind=failure<br/>body=阶段 N 失败一次<br/>stageWhenFailed=N)]
  stageDemote -.继续 / 我知道了<br/>router.replace.-> mainEntry
  failureRec --> feedList

  %% Stage 1 demote 特殊：support tone（PRD §11.L 安全规则）
  stageDemote -. stage=1 走 support 调<br/>建议医生 / 营养师 .-> stageDemote

  %% Home tab interactions
  mainEntry --> homeSlot{HomeMealStatusSlot}
  homeSlot -- 窗内未拍 --> reminderCard[MealReminderCard]
  homeSlot -- 窗末未拍未 ack --> incompleteCard[MealIncompleteCard]
  homeSlot -- default fallback<br/>无窗 / 已拍 / 已 ack --> nextMealCard[NextMealCard<br/>下一顿倒计时 + 3 ⭐]

  reminderCard -- 去拍照 --> photoModal[/(modal)/photo/]
  incompleteCard -- 我知道了 --> ackMissed[/acknowledgeMissedMeal/] --> mainEntry

  %% Photo flow
  photoModal --> photoIntro[intro: 拍 / 相册]
  photoIntro --> photoPreview[preview: 缩略图 + 确定/重选]
  photoPreview --> photoUploading[uploading]
  photoUploading --> photoResult[result: markMealDone → addHp+5 → 鼓励 + 饱腹度 picker]
  photoResult -- 关闭 --> mainEntry
  photoResult -. addHp 命中 HP=100 .-> advanceStage[advanceStage<br/>currentStage+1<br/>HP→50] --> stageEnd

  %% 通知响应
  noti([点本地通知]) --> photoModal

  %% Missed scan
  scanActive([app active / launch]) --> missedScan{{runMissedScan}}
  missedScan -- 检测到错过 --> markMissed[markMealMissed → addHp -10] --> missedModal[/(modal)/meal-missed/]
  missedModal -- 我知道了 --> mainEntry
  markMissed -. addHp 命中 HP<0 .-> demoteStage

  %% Tab navigation
  mainEntry --> records((records))
  mainEntry --> stats((stats))
  mainEntry --> my((my / settings))

  records --> fullnessPicker[顶部饱腹度 3 选 1]
  records --> feedList[feed: meal / fullness / dialogue rows<br/>含 dialogue.kind=failure 暖橘卡]

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
- 第二板块 `<HomeMealStatusSlot>` 三态：`<MealReminderCard>`（窗内）/ `<MealIncompleteCard>`（未 ack 错过）/ `<NextMealCard>`（v0.5 替代之前的 null —— 显示下一顿倒计时 + 3 颗星进度）
- 第三板块 `<HomeRecordsSection>` 与 records tab 同 selector 共享

### Tab 切换

- 4 tab：首页 / 记录 / 统计 / 我的
- 底部 tab bar 双态 icon（实心 selected / 线框 unselected）
- 切 tab 不重 mount tab 内容（默认 Tabs navigator 行为）

### Modal stack（presentation: modal）

| modal | 触发 | 关闭 | 备注 |
|---|---|---|---|
| `/(modal)/photo` | 通知点击 / 首页 "去拍照" 按钮 | 用户关闭 / 完成 result phase | 4 phase：intro/preview/uploading/result |
| `/(modal)/weight-entry` | Stage 2 体重模块点击 | 用户关闭 / 完成 result phase | 4 phase 同上；KeyboardAvoidingView |
| `/(modal)/meal-reminder` | 通知点击（少用，主入口走 photo） | "去拍照" / "稍后再说" | mascot reminder.png |
| `/(modal)/meal-missed` | runMissedScan 命中 | "我知道了" → ack | mascot missed.png + "-10" badge |

### (stage) group — 全屏 page（v0.5 Plan B，普通 navigation 不弹 modal）

| 屏 | 触发 | 离开 | 备注 |
|---|---|---|---|
| `/(stage)/stage-1-start` | 新用户首次进 home（transitionsSeen 检查）| 点 "开始阶段 1" 按钮 → `router.replace('/(main)/home')` | 唯一保留的 start 屏 |
| `/(stage)/stage-{1..5}-end` | advanceStage → transitionsPending push | 点 "完成" 按钮 → `router.replace('/(main)/home')` | 不再串接 next-stage start；包含 NextStepCard 预告下一阶段（非按钮）|
| `/(stage)/stage-{1..5}-demote` | demoteStage（HP<0 触发）→ transitionsPending push | stage 2-5 "继续" / stage 1 "我知道了" → `router.replace('/(main)/home')` | stage 1 走 support 调（PRD §11.L 建议医生）|

布局规则：所有 (stage) 屏统一 `SafeAreaView + ScrollView flex:1 + position:absolute footer` —
按钮永远在视口底部可见，内容长时 ScrollView 滚动不会盖住按钮（contentContainerStyle paddingBottom 给 footer 让位）。

### 后台触发链

- **三餐推送**：onboardingDone + 推送权限 → schedule 3 条本地通知（按 `mealSchedules` 时间）；hp/schedule 变 → reschedule
- **missed-scan**：app launch / AppState active → runMissedScan → 检测今日已过窗末未 done → markMealMissed → addHp(-10) + 双消息 + 弹 modal
- **stage 过渡触发**：(main)/_layout useEffect 监听 currentStage + transitionsPending + transitionsSeen：
  1. transitionsPending 队首（advance/demote 触发）→ push modal + 立即 consume
  2. 否则 stage-1-start 一次性触发（基于 transitionsSeen，幂等）
- **HP 边界（feature/stage-transitions）**：所有 HP 变更走 `addHp(delta)` 统一边界
  - `>=100` → `advanceStage`（currentStage+1, HP→50, push end 到 pending）
  - `<0` → `demoteStage`（stage>1 退 N-1 / stage=1 不变 stage；HP→90，push demote 到 pending；同时 pushDialogue kind=failure 留账）
- **rollDayIfNeeded**：根布局 mount 时跑，跨日则归档昨日 + reset 今日

### Demote / failure（feature/stage-transitions v0.5）

HP 降到 0 以下的处理：

- **Stage 2-5**：currentStage 退到 N-1，HP=90，弹 stage-N-demote modal（"回到阶段 N-1"），同时 pushDialogue 一条 `kind=failure` 留账
- **Stage 1（PRD §11.L 特殊）**：不变 currentStage（不让用户感觉"退无可退"），HP=90，弹 stage-1-demote modal 走 **support 调**：标题"需要支持"+ 建议联系医生 / 营养师 + 暖橘 / 米色调 + 🌫️ mascot；同样落一条 `kind=failure` 留账
- **records / home feed 渲染**：`dialogue.kind === 'failure'` → 走暖橘卡 + 💭 icon + "HP 已重置到 90" 副标 + **无 HP +/- badge**（区别于普通 meal/dialogue 卡）

### Dev panel（__DEV__ only）

settings 页底部出现。能：HP 5 档切 / Stage 1-5 切 / 重置今日 / 重置 onboarding / 清各历史 / 立即触发餐次提醒 / 重置 transitions seen。

feature/stage-transitions 加 "Transitions 测试" 区：

- advance ↑ / demote ↓ / reset seen 3 钮
- **一键场景：模拟 stage 1 失败**（自动 setStage(1) + demoteStage，验证 support modal + failure 留账）
- 11 个 deep-link 钮：1 start + 5 end + 5 demote

跳转目标：大部分是修 store 状态后回 home（不主动 navigate）；"重置 onboarding" 触发 `resetAll` 清全部 + 自动跳回 onboarding/eating。
