# mealmate 组件库

> v0.4 §11.K 第 3 项后期抽出，集中可复用 UI 组件 + 业务模块。
> **每加新组件强制更新此文档**——名称 / 路径 / props / 用在哪 / Figma 参考。

文档目录：

- [基础组件](#基础组件)：`Card` / `PrimaryButton` / `HpHearts`
- [业务模块](#业务模块)：`StatusTitle` / `WeightCard` / `MealCountdownCard` / `RecordCard`
- [Modal](#modal)：`MealReminderModal` / `MissedMealModal`
- [其它](#其它)：`Mascot`（v0.3 emoji 占位，stage 1 主页用） / `WeekStrip` / `HpBar` / `MealCard`

---

## 基础组件

### Card

- 文件：`app/src/components/ui/Card.tsx`
- 来自：新建（基础容器）
- 用在：`StatusTitle` / `WeightCard` / `MealCountdownCard` / `RecordCard` / `MealReminderModal` / `MissedMealModal` 等几乎所有卡片
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | children | ReactNode | ✓ | 卡片内容 |
  | onPress | () => void | | 传入则用 Pressable 包，整卡可点 |
  | style | ViewStyle | | 覆盖内置样式 |
  | className | string | | 额外 nativewind class |

  内置样式：bg `colors.bg.card` / 边框 `colors.border.card` 1px / 16 圆角 / px=20 py=16

### PrimaryButton

- 文件：`app/src/components/ui/PrimaryButton.tsx`
- 来自：抽自 HomeStage2 "去拍照" 按钮
- 用在：`MealCountdownCard` / `MealReminderModal` / `MissedMealModal`
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | label | string | ✓ | 按钮文字 |
  | onPress | () => void | ✓ | 点击回调 |
  | disabled | boolean | | 默认 false；true 时降饱和 + 不响应点击 |

  视觉：bg `colors.brand.green` (#60883b) / 白字 / 16 圆角 / py=16；disabled 时 bg=`hpEmpty`/字色=`sub`/opacity 0.6

### HpHeartsCard

- 文件：`app/src/components/ui/HpHeartsCard.tsx`
- 来自：v0.4 hotfix（HomeStage2 hero 修正）— 由 HpHearts 升级而来：emoji ❤️/🤍 → svg `<Path>` 心形 + Card 包装
- 用在：HomeStage1 / HomeStage2 共用
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | hp | number | ✓ | 0–100 |

  视觉：10 颗 svg 心形 + 右侧 `X/100` 数字（18pt semibold `colors.brand.green`）。
  - 满心填充 `colors.brand.greenSoft` (#8FAE75)
  - 空心填充 `#D8E0CA`（轮廓更浅）
  - 简化：>=50% 视为满心（半填先不画，v0.5 上线前打磨）

  自带 `<Card>` 包装（无需外层再包卡片）。

---

## 业务模块

### StatusTitle

- 文件：`app/src/components/ui/StatusTitle.tsx`
- 来自：抽自 HomeStage2 顶部状态区
- Figma：4 band 主形象帧 (5:45 / 5:14 / 1:305 / 1:332)
- 用在：HomeStage1（v0.4 hotfix 后 HomeStage2 不再用——改用整张 Figma hero PNG，文案 baked 在图里）
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | hp | number | ✓ | 0–100 |
  | stage | 1 \| 2 | | 默认 2；stage=1 切 Stage 1 鼓励调性文案 + mascot 兜底 full.png |

  内部用 `getHpBand(hp, stage)` 自动选 band，输出对应 title / subtitle / hint + mascot Image。文案/资源来自 `src/theme/hp.ts` 的 `HP_BANDS`（stage 2）+ `STAGE1_BAND_COPY`（stage 1）。

### WeightCard

- 文件：`app/src/components/ui/WeightCard.tsx`
- 来自：抽自 HomeStage2 体重模块
- Figma：1:171 frame 体重区
- 用在：HomeStage2（stage=2 显示）
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | lastWeight | WeightRecord | | 最近一次记录；无则显示空态 |
  | prevWeight | WeightRecord | | 倒数第二条；用于 diff 显示 |
  | onPress | () => void | ✓ | 整卡点击 → 跳 weight-entry modal |

  显示：`X.X kg` 大字 + `对比上次 ±X.X kg · MM-DD HH:mm` 副标 + ⚖️ icon。空态："还没有记录哦"。

### MealCountdownCard

- 文件：`app/src/components/ui/MealCountdownCard.tsx`
- 来自：抽自 HomeStage2 倒计时卡
- Figma：1:171 倒计时区
- 用在：HomeStage2
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | schedules | MealSchedule | ✓ | 三餐时间，从 store 读 |
  | todayMeals | TodayMeals | ✓ | 今日完成状态，决定 alreadyDone |
  | onCapture | (slot: MealSlot) => void | ✓ | 点 "去拍照" 时调用 |

  内部 `setInterval(1000)` tick + `getMealWindowState`：
  - 窗内 → "X时间到啦" + 倒计时到窗末
  - 窗外今日 → "距离 X 还有" + 倒计时到下一餐窗起
  - 今日三餐都过 → "明天早餐" + 倒计时到明日窗起
  - alreadyDone 时 PrimaryButton disabled "已记录 ✓"

### RecordCard

- 文件：`app/src/components/ui/RecordCard.tsx`
- 来自：抽自 HomeStage2 今日记录卡，§11.K 第 5 项重写为 polymorphic（接 FeedItem）
- Figma：1:171 今日记录条目；1:79 records 页
- 用在：records 页 feed
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | item | FeedItem | ✓ | 来自 `src/data/feed.ts`，三种 kind： meal / fullness / dialogue |

  渲染规则：
  - `meal`：左 emoji icon (🍽️/💤) + 时间 + "{slot} 已完成 ✓ / 错过了" + HP delta badge
  - `fullness`：emoji + 时间 + "今日饱腹度：X/10 · {slot}"，无 HP delta
  - `dialogue`：当前返 null；§11.K 第 7 项 dialogueHistory shape 升级后实装

### EmptyRecord

- 文件：`app/src/components/ui/EmptyRecord.tsx`
- 来自：抽自 HomeStage1/2 内嵌空态块（§11.K 第 5 项）
- 用在：HomeStage1 / HomeStage2 / records 页
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | text | string | | 默认 "今天还没有记录，等等就要吃饭啦！" |
  | emoji | string | | 默认 🍙；统计页可能用 📊 |

### FullnessRatingPicker

- 文件：`app/src/components/ui/FullnessRatingPicker.tsx`
- 来自：新建（§11.D.1，按 Figma 1:171）
- 用在：records 页顶部；后续 photo result phase 接入留 §11.K 第 7 项
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | selectedScore | FullnessScore | | 已选则该选项加深；没选时全部默认底色 |
  | onSelect | (score: 3 \| 5 \| 8) => void | ✓ | 点击回调，调用方一般直接接 `addFullnessRecord` |

  3 选 1 离散：3=😞/5=😐/8=😊。卡片底色 `#F6F8EB`，选中态加深为 `brand.green/20%`。

---

## Modal

### MealReminderModal

- 文件：`app/src/components/ui/MealReminderModal.tsx`
- 路由：`app/(modal)/meal-reminder.tsx`（presentation: modal）
- Figma：1:265 早餐提醒卡（mascot reminder.png）
- 调用：`router.push({ pathname: '/(modal)/meal-reminder', params: { slot } })`
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | slot | MealSlot | ✓ | 早 / 午 / 晚，决定标题文案 |
  | onCapture | () => void | ✓ | 点 "去拍照" 触发 |
  | onDismiss | () => void | ✓ | 点 "稍后再说" 关闭 |

  内嵌 reminder.png mascot + "{slot}时间到啦!" + 主 CTA。**业务接入未做**：meal window 监听触发 modal、跳 photo flow、HP 加分都留 §11.K 第 7 项。

### MissedMealModal

- 文件：`app/src/components/ui/MissedMealModal.tsx`
- 路由：`app/(modal)/meal-missed.tsx`（presentation: modal）
- Figma：1:79 missed-meal 块（mascot missed.png）
- 调用：`router.push({ pathname: '/(modal)/meal-missed', params: { slot } })`
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | slot | MealSlot | ✓ | 早 / 午 / 晚，决定文案 |
  | onAcknowledge | () => void | ✓ | 点 "我知道了" 关闭 |

  内嵌 missed.png mascot + "你错过了一餐" + "血量 -10" badge + "我知道了"。**业务接入未做**：missed-check 触发、扣分都留 §11.K 第 7 项。

---

## 其它（v0.3 遗留）

| 名称 | 路径 | 用在 | 备注 |
|---|---|---|---|
| `Mascot` | `app/src/components/Mascot.tsx` | `app/onboarding/name.tsx` | emoji 占位（stage prop 切 ⚡ 徽章）；onboarding 录入名字时显示头像 |
| `WeekStrip` | `app/src/components/WeekStrip.tsx` | `HomeStage1` | 7 列周视图，stage 1 特有 |

> v0.4 §11.K 第 10 项已删除孤儿组件 `HpBar.tsx` / `MealCard.tsx`（无引用）。

---

## 图表

### TrendChart

- 文件：`app/src/components/ui/TrendChart.tsx`
- 来自：新建（PRD §11.E，按 Figma 1:458 趋势图卡）
- 依赖：`react-native-svg@15.12.1`（v0.4 §11.K 第 6 项引入）
- 用在：统计页（爱心 / 体重双图）
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | title | string | ✓ | 图表标题（"爱心变化趋势" 等） |
  | subtitle | string | | 副标（单位等） |
  | switcherLabel | string | | 右上 pill 文案；传则显示 disabled 切换器 |
  | dataPoints | TrendPoint[] | ✓ | 每个数据点 `{ stage, value, bandLabel, display? }`；`value=null` 表示该阶段未到达 |
  | yAxis | number[] | ✓ | Y 轴刻度数组，等距 |
  | height | number | | 默认 220px |

  实现：`<Svg>` + `<G>` 分组 + `<Path>` 直线段连相邻有效点 + `<Circle>` 数据点 + `<SvgText>` 数字 / X 轴标签。Y 轴格线用 dashed `<Line>`。

  稀疏降级：
  - 0 个有效点 → 全部空心圆（虚线描边）
  - 1 个有效点 → 一个实心圆 + "再坚持几天就能看到趋势啦~" 提示
  - ≥ 2 → 实心圆 + 直线段连接（跳过 null 点）

  X 轴宽度：用 `onLayout` 获取卡片实际宽度后等距分布数据点。

---

## 截图

v0.5 加（每个组件配一张 simulator 截图 + Figma 帧对照）。
