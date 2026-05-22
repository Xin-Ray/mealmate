## 模块名称
home（首页 tab）

## 模块目标
让用户进 app 第一眼就能：看到伙伴 + HP / stage、看下一餐还有多久、有错过餐就立刻能处理、有体重任务（stage 2+）能拍一张、加餐随时点。home 是阶段感与日内任务感的总枢纽。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：currentStage / hp / todayMeals / mealRecords / dialogueHistory / weightHistory
- [reminder.md](./reminder.md)：selectActiveReminderSlot / selectNextMealCountdown / selectUnackMissedSlot
- [stage-transitions.md](./stage-transitions.md)：(main)/_layout useEffect 触发 (stage) 屏
- [02-business-flows/meal-photo.md](../02-business-flows/meal-photo.md) / [snack.md](../02-business-flows/snack.md) / [weight-entry.md](../02-business-flows/weight-entry.md)

## 对外接口
- 路由：`/(main)/home`
- 子组件：`<HomeStage1>` / `<HomeStage2>` 按 currentStage 切换
- 共用卡片：`<HomeMealStatusSlot>` / `<MealReminderCard>` / `<MealIncompleteCard>` / `<NextMealCard>` / `<MealCountdownCard>` / `<WeightCard>`（stage 2+）/ `<SnackCard>`（snack 分支）/ `<HomeRecordsSection>`
- store action：无写操作，全 read-only（写都在点卡跳的下游 modal 里）

## 核心状态
- `currentStage` 决定渲染 HomeStage1 / Stage2（stage 3-5 暂复用 Stage2 布局）
- `hp` → `<HpHeartsContent>` 渲染血量
- `todayMeals[slot]` → MealStatusSlot 渲染 done / pending / missed
- `mealSchedules` + 当前 ts → reminder 选 active slot
- `mealRecords` + `dialogueHistory` → HomeRecordsSection 显示今日条目
- `weightHistory` → WeightCard 显示最近 kg + diff
- `dialogueHistory.filter(kind='snack_done' && today)` → SnackCard 当日 count

## 核心逻辑
- **顶部**：Mascot + stage 名 + HP 心
- **第一板块**：MealReminderCard（窗内未 done）或 NextMealCard / MealCountdownCard（窗外）
- **第二板块**：MealIncompleteCard（有未 ack missed）
- **第三板块**（stage 2+）：WeightCard 拍体重
- **第四板块**：SnackCard 加餐（snack 分支）
- **第五板块**：HomeRecordsSection 今日记录滚动条
- **页面无写**：所有写入由点击后跳转的 modal / stage 屏完成

## 异常情况
| 异常 | 处理 |
|---|---|
| stage 3-5 | 暂用 HomeStage2 布局（业务逻辑差异在阶段进阶判定层，不在 home 层） |
| HP=0 但仍 stage 1 | 走 demote 路径退到自身（hp=90 + support 调），home 卡正常显示 |
| 当日没任何记录 | HomeRecordsSection 渲染 `<EmptyRecord>` 占位 |
| schedule 全 done | 第一板块隐藏 reminder 改 NextMealCard 显示"明日早餐"倒计时 |
| snack 2/2 | SnackCard 进 disabled 灰版（不响应点击） |

## 注意事项
- home **不调写 action**：所有 +HP / push dialogue / advance / demote 都在子流程里
- (main)/_layout useEffect 才是阶段过渡屏推送的发起点，不是 home page
- stage 切换不触发 home 卸载（同一 tab），靠条件渲染切 HomeStage1/2
- 文案严格按 [PRD §八](../PRD.md)：温柔正向，禁"奖励 / 失败"等词

## 模块不负责什么
- 拍照本身 → [photo.md](./photo.md)
- 体重录入本身 → [weight-entry.md](./weight-entry.md)
- 阶段进阶屏渲染 → [stage-transitions.md](./stage-transitions.md)
- 记录页 / 统计页 / 设置页 → [records.md](./records.md) / [stats.md](./stats.md) / [settings.md](./settings.md)
- HP / stage 增减逻辑 → [store.md](./store.md)
