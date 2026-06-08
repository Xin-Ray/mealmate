# mealmate — 完整 UX 屏幕清单 v1.2.3

> 自动整理 2026-06-08,反映 main HEAD = `49689bb`(含 v1.2.3 改动 1-5,未 bump version)
> 范围:用户能进入 / 看到 / 交互的所有页面、模态、过渡屏、卡片级交互单元
> 不含:纯样式工具(Card / PrimaryButton),selector/data 文件,无 UI 副效应的 service

## 目录

1. [启动流程](#1-启动流程)
2. [Onboarding(4 步)](#2-onboarding4-步)
3. [Stage 0 / 0.5 Home](#3-stage-0--05-home)
4. [Stage 1-5 Home](#4-stage-1-5-home)
5. [过渡屏 (stage)](#5-过渡屏-stage)
6. [拍照流 (photo modal)](#6-拍照流-photo-modal)
7. [体重 / 运动记录](#7-体重--运动记录)
8. [Tab Bar 4 个主屏](#8-tab-bar-4-个主屏)
9. [Settings 详细](#9-settings-详细)
10. [辅助模态 / 卡片级交互](#10-辅助模态--卡片级交互)

---

## 路由架构概览

```
app/app/                              ← expo-router file-based routing
├── _layout.tsx                       ← Root: GestureHandler + SafeAreaProvider +
│                                       Stack + LaunchAnimation 覆盖
├── index.tsx                         ← 入口 redirect (onboarding / home)
├── onboarding/                       ← 4 步 flow,Stack pages
│   ├── eating.tsx                    ← 1/4
│   ├── profile.tsx                   ← 2/4(v1.1 OPEN-1 加)
│   ├── schedule.tsx                  ← 3/4
│   └── name.tsx                      ← 4/4 → finishOnboarding → home
├── (main)/                           ← 4 tab navigator
│   ├── _layout.tsx                   ← Tabs + transitionsPending consumer
│   ├── home.tsx                      ← switch currentStage → HomeStageN
│   ├── records.tsx                   ← 记录 SectionList
│   ├── stats.tsx                     ← 统计 3 图表 × 3 子 tab
│   └── settings.tsx                  ← 我的(含 DEV panel)
├── (modal)/                          ← modal presentation
│   ├── photo.tsx                     ← 拍照 → detect → result
│   ├── weight-entry.tsx              ← 体重秤 OCR + 手填
│   ├── meal-reminder.tsx             ← 占位 modal(deep link)
│   └── meal-missed.tsx               ← 错过餐次 modal(通知点击入口)
└── (stage)/                          ← 过渡屏 全屏 page presentation
    ├── _layout.tsx
    ├── stage-0-start.tsx             ← 「这里慢慢来」
    ├── stage-0-end.tsx               ← 「太棒了！这就开始了」
    ├── stage-0_5-start.tsx           ← 「集齐 4 颗爱心 ❤️」(0_5 文件名兼容 "."  )
    ├── stage-0_5-end.tsx             ← 「我们做到了 🎉」
    ├── stage-1-start.tsx             ← stage-1 唯一保留 start
    ├── stage-1-end.tsx               ← advance trigger
    ├── stage-1-demote.tsx            ← HP<0 / score=0 trigger(stage 1 鼓励调)
    ├── stage-2-end.tsx, stage-2-demote.tsx
    ├── stage-3-end.tsx, stage-3-demote.tsx
    ├── stage-4-start.tsx, stage-4-end.tsx, stage-4-demote.tsx
    └── stage-5-start.tsx, stage-5-end.tsx, stage-5-demote.tsx
```

入口判定(`app/index.tsx`):
- `!onboardingDone` → `/onboarding/eating`
- 否则 → `/(main)/home`

启动覆盖(`app/_layout.tsx`):root 渲染 `<LaunchAnimation>` 在 Stack 之上,fade out 后 unmount

---

## 1. 启动流程

### 1.1 LaunchAnimation(冷启动 splash)

**路径**: 无独立路由,渲染在 `app/app/_layout.tsx` root 之上
**组件文件**: `app/src/components/launch/LaunchAnimation.tsx`(v1.2.3 改动 #4)
**触发**: 每次冷启动 app 自动播
**退出**: 视频播完(3s)自动触发 fade out 400ms → unmount → 露下方 Stack;用户点屏也立刻 fade
**主要 UI 元素**:
- 全屏 `<Video>` (expo-av),source = `assets/animations/launch.mp4`(3s, 1.1 MB, 960×540)
- resizeMode COVER,shouldPlay,isLooping=false,isMuted=false(带音)
- 黑底兜底防 fade 时边缘漏
- Pressable 包整层 → onPress 触发 startFadeOut
**数据读取**: 无 store(独立 React state)
**数据写入**: 无(纯展示)
**空态 / 错态 / 边界**:
- expo-av native 模块未装(dev client 没 prebuild)→ Video 不渲染,直接黑屏 → 用户点屏跳过
- 后台 → 前台不算冷启动(React state 在内存),不重播
- kill app 重启 → 重新播

---

## 2. Onboarding(4 步)

### 2.1 eating(第 1/4 步 最近吃饭)

**路径**: `app/app/onboarding/eating.tsx`
**触发**: 新用户进 app + `onboardingDone=false` → 入口 redirect
**退出**: 选完一个 chip → 点「下一步」→ `/onboarding/profile`
**主要 UI 元素**:
- 顶部小字「第 1 / 4 步」
- 标题 + 副标说明(最近吃饭怎么样)
- 3 个 chip:正常 / 想多吃点 / 不太规律
- 底部 sticky 按钮「下一步」(灰 disabled 直到选)
**数据写入**: `setGentleMode(picked === "irregular")` — irregular 用户开温柔模式(漏餐扣 HP 减半)
**边界**: 单选,不选不让 next

### 2.2 profile(第 2/4 步 身高 / 性别 / 族裔)

**路径**: `app/app/onboarding/profile.tsx`
**触发**: eating 完
**退出**: 都填 → 「下一步」 → `/onboarding/schedule`
**主要 UI 元素**:
- 「第 2 / 4 步」
- 身高 TextInput(数字键盘 + InputAccessoryView「完成」按钮 — 2026-05-30 hotfix 防键盘挡按钮)
- 性别 3 chip:女 / 男 / 其它
- 族裔 2 chip:亚洲 / 其它(用于 BMI 公式)
- 屏空白 Pressable → Keyboard.dismiss
- KeyboardAvoidingView 包 outer + ScrollView 内层
**数据写入**: `setHeight / setGender / setEthnicity`(供 stage 4 standardWeight 计算)
**空态 / 边界**: 字段都可选(老用户 migrate 来时全 null),profile 可在 settings 二次编辑

### 2.3 schedule(第 3/4 步 三餐时间)

**路径**: `app/app/onboarding/schedule.tsx`
**触发**: profile 完
**退出**: 三时段都设了(或保留默认 08:00/12:00/18:00)→ 「下一步」 → `/onboarding/name`
**主要 UI 元素**:
- 「第 3 / 4 步」
- 早 / 午 / 晚 三行,每行点开 `@react-native-community/datetimepicker`
- 显示当前 HH:MM
**数据写入**: `setMealSchedule(slot, "HH:MM")`

### 2.4 name(第 4/4 步 mascot 取名)

**路径**: `app/app/onboarding/name.tsx`
**触发**: schedule 完
**退出**: 输入名字 → 「完成」 → `setRobotName + finishOnboarding` → `router.replace('/(main)/home')`
**主要 UI 元素**:
- 「第 4 / 4 步」「给它取个名字」
- mascot Image
- TextInput 名字(默认「小满」)
- 「完成」按钮
**数据写入**: `setRobotName`, `finishOnboarding` (设 onboardingDone=true + onboardingCompletedAt)

---

## 3. Stage 0 / 0.5 Home

> v1.2.1 新增的入门缓冲层。仅新装 v1.2.1+ 用户走;老用户 migrate 保留各自 stage。

### 3.1 HomeStage0「试一下」

**路径**: `(main)/home` 当 `currentStage === 0`
**组件**: `app/src/components/home/HomeStage0.tsx`
**触发**: 新用户 onboarding 完(initialState.currentStage=0)+ `transitionsPending=[{stage:0,kind:"start"}]` 自动弹 start 屏后落到这
**退出**: 点 CTA → 拍 1 张通过 Food-101 验证的餐照 → `advanceFromStage0` → Stage 0.5
**主要 UI 元素**:
- StageChip「阶段 0 · 试一下」(暖橘)
- Mascot 居中(stage 1 full.png 兜底)
- 标题「先拍一张餐照试试吧」(26px 深绿 bold)
- 副标「不饿也没关系，就是让我看看」
- **大绿 CTA 按钮「拍一张餐照」**(plain object style — v1.2.2 P0 React Compiler 坑修)
- subtle 链接「身边没食物?用示例图试试 →」(v1.2.3 兜底,sample=1 加载 bundled pizza)
**数据读取**: `currentStage`(隐含,通过 router 进)
**数据写入**: 无(本屏)
**特意不显示**: HP 条 / WeekStrip / 餐时段 / 体重 / SnackCard / Stats tab(避免分流)
**边界**:
- 网络断 → 跳 photo modal 后,detectFood fail → rejected 软文案「网不太好,等会儿再来试一下吧」
- 照片不是食物 → rejected「再来一张吧 / 这次让我看清楚是什么 ✨」

### 3.2 HomeStage0_5「起步」(4 颗爱心)

**路径**: `(main)/home` 当 `currentStage === 0.5`
**组件**: `app/src/components/home/HomeStage0_5.tsx`
**触发**: `advanceFromStage0` 后落到这 + transitions 链(0 end → 0.5 start)弹完
**退出**: 拍 4 张通过验证的餐照(或加餐)→ stage05Score 到 40 → `advanceFromStage05` → Stage 1
**主要 UI 元素**:
- StageChip「阶段 0.5 · 起步」
- WeekStrip(同 stage 1)
- Mascot card(stage 1 full.png)+ overlay 文字「慢慢来 / 每一顿都算 / 集齐 4 颗 ❤️ 就正式开始」
- **HeartProgress 浮卡**:4 颗心,filled = stage05Score / 10,「N / 4 颗爱心 · 每一顿都算 · 慢慢来」
- HomeMealStatusSlot(3 态卡:MealReminder / MealIncomplete / NextMealCard)
- SnackCard(可加餐,每日上限 SNACK_DAILY_LIMIT=2,触发 +1 颗心)
- HomeRecordsSection(今日 records 预览)
**数据读取**: `stage05Score / todayMeals / todayKey / mealHistory`
**数据写入**: 无(交互走 modal/photo 流)
**边界**: 漏餐免疫(`runMissedScan` 在 stage<1 早 return,WeekStrip cell 不变红)

---

## 4. Stage 1-5 Home

### 4.1 HomeStage1「坚持」

**路径**: `(main)/home` 当 `currentStage === 1`
**组件**: `app/src/components/home/HomeStage1.tsx`
**触发**: stage 0.5 通关 OR 老用户 currentStage=1
**主要 UI 元素**(v1.2.3 改动 #5 后):
- StageChip「阶段 1 · 坚持」
- WeekStrip 当周三餐打卡
- Mascot card + band text overlay(`pseudoHp = stageScore/40*100` 喂 `getHpBand(_, 1)`)
- **HeartProgress 浮卡** 4 颗心,filled = stageScore / 10(target=40)
- HomeMealStatusSlot
- SnackCard(2/天)
- HomeRecordsSection
**数据读取**: `stageScore / todayMeals / todayKey / mealHistory`
**数据写入**: 无
**边界**:
- 不显示 WeightCard(stage 2+ 才开)
- 不显示 ExerciseCard(stage 3+)

### 4.2 HomeStage2「量化」

**路径**: 同上 `currentStage === 2`
**组件**: `HomeStage2.tsx`
**主要 UI 元素**:
- StageChip「阶段 2 · 量化」
- WeekStripConnected(stage 2+ 用)
- Mascot card + band overlay(pseudoHp = stageScore/50*100)
- **HeartProgress** 5 颗心,target=50
- **WeightCard**(新增)— 当前体重 + diff,点跳 weight-entry modal
- HomeMealStatusSlot + SnackCard + HomeRecordsSection
**数据读取**: 加 `weightHistory`
**边界**: hpHistory 仍累积(Stats 图表用)

### 4.3 HomeStage3「健康增重」

**路径**: `currentStage === 3`
**组件**: `HomeStage3.tsx`
**主要 UI 元素**:
- StageChip「阶段 3 · 健康增重」
- 跟 stage 2 同骨架
- **HeartProgress** 3 颗心,target=30
- WeightCard
- **ExerciseCard**(新增,stage 3 起)— 占位 `今日 0/1 次`,onPress 弹 Alert 「开发中」(OPEN-R1-C 数据源未决)
- HomeMealStatusSlot + SnackCard + HomeRecordsSection

### 4.4 HomeStage4「营养」

**路径**: `currentStage === 4`
**组件**: `HomeStage4.tsx`
**主要 UI 元素**(独立 layout,跟 stage 2 视觉差别大):
- **ProfileSetupBanner**(条件:`height===null` 时顶部弹引导填体质数据)
- StageChip「阶段 4 · 营养」
- WeekStripConnected
- **Hero**:circular weight progress(MetricsRow / WeightGoalProgressCard)+ mascot
- **3 列指标行**:当前体重 / 目标体重 / 已运动次数
- **★ StarRating**(由 weight 区间判)
- HomeMealStatusSlot
- **WeeklyFoodProgress**(主食 / 蔬菜进度,TODO 数据源待 backend)
- **MealStatusDots**(早午晚 status 圆)
- SnackCard
- WeightCard + TrendChart(体重时间线,7 天)
- ExerciseCard
- HomeRecordsSection
**数据读取**: `weightHistory / height / gender / ethnicity / targetWeight / 多 selector`
**数据写入**: WeightGoalProgressCard 内部可能调 `__internal_runStage5Check` via addWeightRecord 链路
**边界**: HP 仍参与,但 advance 触发条件是 weight ≥ standardWeight(BMI × height²)

### 4.5 HomeStage5「持之以恒」

**路径**: `currentStage === 5`
**组件**: `HomeStage5.tsx`
**主要 UI 元素**:
- StageChip「阶段 5 · 持之以恒」
- Hero「不朽印记 {stage5Stars}」+ subtitle「让坚持变成一种习惯」
- 60 天进度条(已坚持 N/60 天)
- WeekStripConnected + Mascot card
- MetricsRow + WeightGoalProgressCard(去 circular,因为已在目标区间)
- WeightCard + TrendChart
- HomeMealStatusSlot + SnackCard + ExerciseCard + HomeRecordsSection
**数据读取**: `stage5Stars / stage5StartedAt / weightHistory`
**特意删除**: MealStatusDots + WeeklyFoodProgress(r1 F12+F13)
**边界**:
- 0 星 → demoteStage 回 4
- 60 天未 demote → advance 触发 stage-5-end(虽然 stage>=5 no-op,但仍 push transition)

---

## 5. 过渡屏 (stage)

> `(main)/_layout.tsx` consumer 检测 `transitionsPending[0]` → `router.replace('/(stage)/stage-{seg}-{kind}')` → consume queue;`seg = stage === 0.5 ? "0_5" : String(stage)`(expo-router 文件名兼容)

### 5.1 stage-0-start「这里慢慢来」(v1.2.1 改动)

**路径**: `app/app/(stage)/stage-0-start.tsx`
**组件**: 用 `SimpleTransitionScreen`(badge + mascot + title + subtitle + sticky CTA)
**触发**: 新用户 initialState `transitionsPending=[{stage:0,kind:"start"}]` 自动弹
**退出**: 「开始」按钮 → `router.replace('/(main)/home')` → 落到 HomeStage0
**主要 UI**:
- chip「试一下」
- mascot 居中
- 标题「这里慢慢来」
- 副标「先拍一张餐照试试」
- 「开始」按钮(plain object style — React Compiler 坑修)

### 5.2 stage-0-end「太棒了！」

**路径**: `(stage)/stage-0-end.tsx`
**触发**: photo.tsx 拍照通过 → `advanceFromStage0` 推 `{stage:0,kind:"end"}`
**主要 UI**: chip「试一下 · 完成」+ 「太棒了！/ 这就开始了」+「继续」按钮

### 5.3 stage-0_5-start「下一步」

**路径**: `(stage)/stage-0_5-start.tsx`(文件名 0_5 防 expo-router 不允许 "." )
**触发**: `advanceFromStage0` 同步推 `{stage:0.5,kind:"start"}`(跟在 0 end 后面)
**主要 UI**: chip「起步」+ 「下一步 / 集齐 4 颗爱心 ❤️，我们就正式开始」

### 5.4 stage-0_5-end「我们做到了 🎉」

**路径**: `(stage)/stage-0_5-end.tsx`
**触发**: `incrementStage05Score` 达 40 → `advanceFromStage05` 推 `{stage:0.5,kind:"end"}`
**主要 UI**: chip「起步 · 完成」+ 「我们做到了 🎉 / 从今天起，我们一起按时吃饭」

### 5.5 stage-1-start(唯一保留的非 0 stage start)

**路径**: `(stage)/stage-1-start.tsx`
**组件**: 用 `StageStartScreen` + `STAGE_TRANSITIONS[1].start`(stats card + rules + note banner)
**触发**: `(main)/_layout` 检测 currentStage=1 且未在 `transitionsSeen`(老用户首次进 home / advanceFromStage05 推 + markTransitionSeen)
**退出**: 「开始阶段 1」→ markTransitionSeen + router.replace /(main)/home
**主要 UI**:
- Hero(左 pill「坚持」+ 标题 + emoji illustration 右)
- divider + description
- Stats card 3 列(初始 HP / 通关分数 / 关键)— **note: v1.2.3 改动 #5 后 HP→stageScore,文案可能需更新**
- 「本阶段重点」+ 3 Rule cards
- Note banner(柔绿)
- sticky「开始阶段 1」

### 5.6 stage-N-end(stage 1-5)

**路径**: `(stage)/stage-{1..5}-end.tsx`
**组件**: `StageEndScreen` + `STAGE_TRANSITIONS[N].end`
**触发**: `advanceStage()` 内部 push `{stage:oldStage,kind:"end"}` 到 pending
**主要 UI**:
- chip「{name} · 完成」
- mascot
- 成就 cards
- nextStage info(可选,如 stage 1 end 提 stage 2)
- 「完成」按钮 → `router.replace('/(main)/home')`

### 5.7 stage-N-demote(stage 1-5)

**路径**: `(stage)/stage-{1..5}-demote.tsx`
**组件**: `StageDemoteScreen`(橘色调,鼓励调)
**触发**: `demoteStage()` 内部 push `{stage:oldStage,kind:"demote"}`
**特殊**:
- **stage-1-demote**: 不实际退阶(已是最早期),只重置 hp=90,文案「加油，从头开始也没关系」
- **stage-2..5-demote**: currentStage 回退 N-1,文案「回到阶段 N-1，请继续努力」
- v1.2.3 改动 #5 后 stage 1/2/3 走 stageScore,demote 路径**不再触发**(score=0 不 demote,OPEN-6 B);stage 4/5 仍走旧 hp/demote

### 5.8 stage-4-start / stage-5-start

**路径**: `(stage)/stage-4-start.tsx` / `stage-5-start.tsx`
**触发**: settings DEV jump(仅测试),正常流程不弹(从 stage 3 advance 直接 → home,不串接 start)
**主要 UI**: 类似 stage-1-start 但用 STAGE_TRANSITIONS[4/5].start 数据

---

## 6. 拍照流 (photo modal)

### 6.1 (modal)/photo

**路径**: `app/app/(modal)/photo.tsx`
**组件**: 大型单文件 ~440 行
**触发**:
- 通知点击 → `router.push('/(modal)/photo?slot=lunch')`
- HomeMealStatusSlot 内的 MealReminderCard 点击
- SnackCard 点击 → `?snack=true`
- HomeStage0 CTA → 不带 slot(closestSlotByWallClock 决定)
- HomeStage0「身边没食物?」link → `?sample=1`(v1.2.3,自动加载 bundled pizza)
- meal-reminder modal「拍一张」
**退出**:
- result phase 「完成」按钮 → `router.back()`
- 或 onConfirm 内 push 过渡屏(stage 0)→ 自动 nav

**Phases**(state machine):

#### 6.1.1 intro
- 大字「拍一张你正在吃的或准备吃的就行，哪怕只是一杯牛奶」
- 按钮「拍一张」(camera)+ 「从相册选」(library)
- `pickImageWithFallback` 调 expo-image-picker

#### 6.1.2 preview
- 显示选中 image(280×280 圆角)
- 「看起来怎么样？」
- 「确定」按钮(orange 主) + 「重拍/重选」按钮
- v1.2.3 sample=1 时,跳过 intro 直接进 preview(useEffect 自动加载 bundled pizza URI)

#### 6.1.3 uploading
- 显示 image 缩(220×220)+ 「上传中...」
- 调 `detectFood(imageUri)` 等待 Food-101 backend 响应

#### 6.1.4 rejected
- 显示 image 半透(opacity 0.6)
- **no_food**: 标题「看起来不像食物哦」/ 「换个角度重拍一张？要让我能看清楚是什么食物 ✨」
  - Stage 0 软化:「再来一张吧 / 这次让我看清楚是什么 ✨」
- **network_fail**: 「识别服务连不上 / 请检查网络后重拍」
  - Stage 0 软化:「网不太好 / 等会儿再来试一下吧」
- 「重拍一张」按钮 + 「先回首页」按钮
- TODO(v1.2.x): 连续 3 次 reject → 「需要帮助?」link 到 FAQ(暂未实现)

#### 6.1.5 result
- 「血量 +{N}」绿圆 badge(scale animation)
- image 缩(160×160)
- mascot 卡片:`doneLine` + 可选 `encourageLine`
- 识别 chips(top 3 predictions),每个「{label} · {N}%」
- 饱腹度 picker(`<FullnessRatingPicker>`,正餐才显,加餐跳过)
- 「完成」按钮(若 stage 0:跳过 CelebrationModal,直接 push transitions)
- 「重拍一张」按钮(`confirmedOnce=true`,重拍只更新识别,不重复 +HP/dialogue)

**关键逻辑**(v1.2.3):
- isStage0 分支:不 markMealDone,只 pushDialogue + advanceFromStage0
- isStage0.5: markMealDone → incrementStage05Score(+10) → 可能 advance
- isStage 1/2/3: markMealDone → __internal_addStageScore(+10) → 可能 advance
- isStage 4/5: markMealDone → addHp(+10) → 可能 advance
- isStage 0 跳过 CelebrationModal(stage_0_end 过渡屏代替,避免双"太棒了！")

**辅助模态**(覆盖在 photo 上):
- `<CelebrationModal>`(stage 1+ 拍完 result 自动弹)— 见 §10.1

---

## 7. 体重 / 运动记录

### 7.1 (modal)/weight-entry

**路径**: `app/app/(modal)/weight-entry.tsx`
**触发**: WeightCard 点击 → `router.push('/(modal)/weight-entry')`
**退出**: 输入完 → 「保存」 → `addWeightRecord` → `router.back()`
**Phases**: intro / preview / uploading / result(同 photo modal 模式)
**主要 UI**:
- 拍秤面照片(或跳过 — 看 `skipWeightPhoto` 设置)
- OCR 状态指示:idle / recognizing / done / failed
- TextInput 体重 kg(支持 1 位小数;OCR done 时自动填,user 可改)
- 完成按钮(KeyboardAvoidingView + ScrollView,iOS 完成按钮 InputAccessoryView)
- mascot 文案池(按当前 HP band)
**数据读取**: `hp / skipWeightPhoto / robotName`
**数据写入**: `addWeightRecord({kg, photoUri})` — stage 4/5 可能链触 advance/demote/runStage5Check
**Stage 4 → 5**: 体重 ≥ standardWeight → 自动 advance
**Stage 5**: 每次记触发 stage5 星数判定(`__internal_runStage5Check`)

### 7.2 ExerciseCard(home stage 3/4/5 内卡)

**组件**: `app/src/components/ui/ExerciseCard.tsx`(占位)
**触发**: HomeStage3/4/5 内卡 Pressable
**主要 UI**: 左标题「今日运动」+ 「0/1 次」(硬编码占位)+ 右绿底相机圆头
**onPress**: 弹 Alert「开发中」(OPEN-R1-C 数据未决)
**TODO**: store 加 `exerciseHistory` + `(modal)/exercise.tsx`

---

## 8. Tab Bar 4 个主屏

底部 Tab(`(main)/_layout.tsx`):4 tab(home / records / stats / settings),tabBar icon 双态(on/off PNG)

### 8.1 (main)/home — 首页

见 §3 + §4。switch `currentStage` 渲染对应 `<HomeStageN />`。
default fallback → HomeStage1。

### 8.2 (main)/records — 记录

**路径**: `app/app/(main)/records.tsx`
**主要 UI 元素**:
- 顶部标题「记录」(24px bold)
- SectionList 按日期 group(formatSectionDate)
- 每 section header 显示日期(2026-06-08 / 周一)
- 每 row 用 `<TodayRecordRow>`:
  - meal_done / meal_missed / snack_done / dialogue / fullness / weight 不同 kind 渲染
  - 显示 mascot avatar(records.png)+ body + hpDelta badge + ts
- ListEmpty: `<EmptyRecord />` 空态卡
**数据读取**: `fullnessHistory / mealRecords / dialogueHistory` → `buildAllFeed` → `sectionizeFeedByDate`
**边界**: dialogueHistory 最多 50 条,mealRecords 滑窗,空态友好

### 8.3 (main)/stats — 统计

**路径**: `app/app/(main)/stats.tsx`
**主要 UI**:
- 页头「📊 趋势图表」+ 副标「记录每一份努力，见证每一点进步」
- 子 tab(周 / 月 / 全部),segmented control 样式
- 3 个 `<StatsChart>`:
  - HP / stageScore 时间线(注:v1.2.3 后可能只在 stage 4/5 准)
  - 体重时间线(stage 2+)
  - 阶段历史(stageHistory 阶梯线)
**数据读取**: `selectHpTimeline / selectWeightTimeline / selectStageStepLine` 各 selector
**边界**: 数据不足显示空态,stage 1+ 才有 HP 数据,stage 2+ 才有体重

### 8.4 (main)/settings — 我的

**路径**: `app/app/(main)/settings.tsx`(大文件 ~900 行)
**主要 sections**:
- profile(name + mealSchedules + targetWeight + 健康数据 height/gender/ethnicity)
- 温柔模式 toggle
- 跳过称重照片 toggle
- Apple Sign In 入口 + 同步状态(account / lastSyncedAt)
- 关于 / 隐私
- 危险区(重置 / 删除账号)
- **开发者(仅 __DEV__)** — 见 §9

---

## 9. Settings 详细

### 9.1 Profile 编辑(顶部)

**字段**:
- robotName(TextInput)
- mealSchedules(3 个 time picker)
- targetWeight(数字 input,stage 4/5 显示)
- 健康数据 section:height / gender(3 chip) / ethnicity(2 chip)
- 加餐每日上限(`SNACK_DAILY_LIMIT=2`,只显示,不可改)

### 9.2 账号(Apple Sign In)

- 未登录 → 显示「Sign in with Apple」按钮(`expo-apple-authentication`)
- 已登录 → 邮箱 + 「刚刚同步 / 几分钟前」
- 「登出」 / 「删除账号」按钮

### 9.3 危险区

- 「重置今日三餐」
- 「重置 onboarding（清全部数据）」
- 「清空饱腹度评分 / 餐次记录 / 对话历史」
- 「立即触发餐次提醒(5 秒后弹)」

### 9.4 开发者 panel(仅 __DEV__)

**HP 快设**: `[0, 25, 50, 75, 100]` 按钮(`__dev_setHp`)
**阶段跳板**:
- Stage 0 / 0.5(v1.2.1 新)
- Stage 1-5
- stage=0.5 时显示 stage05Score 快设 `[0, 10, 20, 30, 40]`
- (v1.2.3 todo)stage 1/2/3 时显示 `__dev_setStageScore` 快设

**Transitions 测试**:
- advance ↑ / demote ↓ / reset seen
- 模拟 stage 1 失败
- 跳屏 直跳 4 个 stage 0/0.5 transition + stage-1-start + 1-5 end / demote

**清空 actions**: 重置今日 / 清空体重 / 饱腹 / mealRecords / dialogue 等

---

## 10. 辅助模态 / 卡片级交互

### 10.1 CelebrationModal(v1.2.3 升级)

**组件**: `app/src/components/photo/CelebrationModal.tsx`
**触发**: photo.tsx result phase 自动 `setCelebrationOpen(true)`(stage 0 跳过)
**视觉**(v1.2.3 改 #3):
- 白卡 borderRadius 28 + 强阴影(shadowRadius 16 + elevation 10)
- **顶部 48px 绿圆 ✓ badge**(半压卡顶,3px 白边,spring scale-in)
- 标题「太棒了！」(24px 深绿) + 小 ✓
- 副标 `doneLine`(灰)
- **mascot box**(`F4F8E8` 浅米绿 + borderRadius 20)+ `assets/mascot/celebration.png`(thumbs-up 男孩)
- 「💚 血量 +{N}」+ 浮字 zoom-in fadeout
- **绿 pill CTA「继续加油！」**(borderRadius 28,plain object style)
**动画**(reanimated v4):
- t=0: 卡 scale 0.85→1 spring + opacity 0→1
- t=80: badge scale spring
- t=120: mascot bounce ±8px 2 cycles
- t=200: +N 浮字 zoom + translateY -20 fadeout(400ms)
**退出**: 「继续加油！」 → fadeout 150ms → onContinue → unmount

### 10.2 MealReminderCard(home 内)

**触发**: HomeMealStatusSlot 检测当前在 meal window 内 + 该 slot 今日未 done
**主要 UI**: 「{slotLabel}时间到啦！」+ 「记得在 1.5 小时内拍照记录哦~」+ 倒计时(到 windowEnd)+ 「拍一张」CTA
**onPress**: → `router.push('/(modal)/photo?slot={slot}')`

### 10.3 MealIncompleteCard(home 内)

**触发**: HomeMealStatusSlot 检测有未 ack 的 missed slot
**主要 UI**: 「{slot}没吃啊」+ mascot + 「我知道了」按钮 → `acknowledgeMissedMeal`

### 10.4 NextMealCard(home 内,v1.2.3 修)

**触发**: 默认 fallback(无 active reminder / 无未 ack missed)
**主要 UI**: 「距离下一顿 / {prefix}{slot} 还有 HH:MM:SS」+ 3 颗星(早/午/晚 status)
**v1.2.3 fix**:
- `useState(() => Date.now())` 真 state(不再 `[, setTick]` 被 RC 当死代码)
- 显式喂 selector `new Date(nowMs)`
- HomeMealStatusSlot 加 30s ticker 切卡(meal schedule 跨越时不 stuck)

### 10.5 SnackCard(home 内)

**触发**: stage 0.5 / 1-5 home 内常驻
**主要 UI**:
- 顶部「加餐」label + 「今日 N/2」badge(v1.2.3 改 #4 回退 SNACK_DAILY_LIMIT 3→2)
- 大字:`isFull`「今日加餐已用完」/ `count=0`「拍一张，+10 HP」/ 其他「再加一次，+10 HP」
- 副标:isFull「明天再来」/ 其他「拍照记录加餐」(v1.2.1 去掉「随时都算数」cheat 暗示)
- Plain object Pressable style(v1.2.2 P0 fix)
**onPress**: → `router.push('/(modal)/photo?snack=true')`

### 10.6 (modal)/meal-reminder

**路径**: `app/app/(modal)/meal-reminder.tsx`
**组件**: `<MealReminderModal slot={...}>`
**触发**: 通知点击 → deep link(占位,业务接入留 §11.K)
**退出**: 「拍一张」 → dismiss + `router.push('/(modal)/photo?slot=...')`;「以后再说」 → dismiss

### 10.7 (modal)/meal-missed

**路径**: `app/app/(modal)/meal-missed.tsx`
**组件**: `<MissedMealModal slot={...}>`
**触发**: `_layout.tsx` `runMissedScan` 返回新 missed → push;通知点击 OR missed-scan 兜底入口
**退出**: 「我知道了」 → `acknowledgeMissedMeal(slot, todayKey)` + dismiss
**注**: 已是次入口 — 主要交互走首页 MealIncompleteCard

### 10.8 ProfileSetupBanner

**触发**: HomeStage4 内 `height === null`(老用户 v10 migrate 没填体质数据,升 stage 4 时提醒)
**主要 UI**: 「补充健康数据,让我更懂你」+ 「去补充」CTA → `router.push('/(main)/settings')`(滚到健康数据 section)
**已实现**: commit #12c

### 10.9 留坑(v1.2.x)

- 「需要帮助?」FAQ 静态页(Stage 0 reject 3 次后弹)— `(modal)/help-faq.tsx`,未实现
- Welcome modal(老用户 v1.1 → v1.2.1 升级提醒)— OPEN-2 决定不做老用户 reset,所以这个 modal 也不需要
- 运动记录 photo flow(`(modal)/exercise.tsx`)— OPEN-R1-C 待 backend 决数据结构

---

## 数据流参考表

| Store 字段 | 写入 actions | 主要读 UI |
|---|---|---|
| `currentStage` | finishOnboarding / advanceStage / demoteStage / advanceFromStage0 / advanceFromStage05 / __dev_setStage | `(main)/home` switch / StageChip |
| `hp` | addHp / advanceStage(init) / demoteStage(reset 90) / __dev_setHp | HomeStage4/5 / weight-entry mascot band / stats |
| `stageScore`(v14)| __internal_addStageScore / advanceStage(reset 0) / __dev_setStageScore | HomeStage1/2/3 HeartProgress + band overlay |
| `stage0Done`(v13) | advanceFromStage0 | (内部 flag,不直接渲染)|
| `stage05Score`(v13) | incrementStage05Score / advanceFromStage05(锁 40)/ __dev_setStage05Score | HomeStage0_5 HeartProgress |
| `todayMeals` | markMealDone / markMealMissed / rollDayIfNeeded | WeekStrip / NextMealCard stars / 餐时段卡 |
| `mealRecords` | markMealDone / markMealMissed / acknowledgeMissedMeal | records tab / WeekStrip history |
| `weightHistory` | addWeightRecord | WeightCard / TrendChart / Stage 4-5 hero |
| `dialogueHistory` | pushDialogue / addSnack | records tab feed |
| `transitionsPending` | advanceStage / demoteStage / advanceFromStage0 / advanceFromStage05 / __internal_runStage5Check | `(main)/_layout` consumer → push (stage) routes |
| `transitionsSeen` | markTransitionSeen | stage-1-start 一次性 gating |

---

## 已知 UX 限制(v1.2.3)

| # | 限制 | 缓解 |
|---|---|---|
| 1 | iOS sim 冷启动通知 permission dialog 遮 home(`simctl privacy grant` 无效)| 真机第一次手动 tap Allow 后永久 OK |
| 2 | expo-av launch video 在 sim 上不动 native rebuild 不渲染 | `npx expo run:ios --device <sim_uuid>` 重 build dev client 后 ok;EAS Build 自动包含 |
| 3 | photo flow / weight-entry OCR 需要 backend 可达(api.flykid.xyz)| 离线时 rejected("network_fail")友好文案,严格模式不打卡 |
| 4 | Stage 4 ProfileSetupBanner 老用户 height=null 时弹 | 一次性,fill 后消失 |
| 5 | React Compiler swallow Pressable 函数式 style → 按钮 bg 丢 | 全部改 plain object,grep `style={({pressed` 必为 0 |

---

## 改一处屏 = 改这几个文件 checklist

新建 1 个屏需要:
- [ ] `app/app/<route>.tsx` route entry
- [ ] `app/src/components/<area>/<Component>.tsx` UI
- [ ] 若是 modal:`app/_layout.tsx` 加 Stack.Screen options
- [ ] 若是 tab:`(main)/_layout.tsx` 加 Tabs.Screen
- [ ] 若是 stage transition:更新 `STAGE_TRANSITIONS` 数据 + consumer 路径段
- [ ] 数据流:store action / selector 改完检查所有屏的 read 别 stale
- [ ] React Compiler:Pressable 用 plain object,不用 `({pressed}) => style`
- [ ] 截图占位:`docs/ux/all-screens.md` 对应 section 加 entry

---

## 截图待补

每屏目前都 `<!-- 截图占位 -->`。后续走真机截图时填进来,路径建议 `docs/ux/shots/<section>-<name>.png`。

`/tmp/v1.2.3-shots/` 有 sim 部分截图(stage1/2/3 home + launch video frames + photo sample preview),可手动 cp 进来。
