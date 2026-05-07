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

### HpHearts

- 文件：`app/src/components/ui/HpHearts.tsx`
- 来自：v0.4 §11.B step 1 起原生新建
- 用在：HomeStage2 HP 心形条卡片
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | hp | number | ✓ | 0–100 |

  10 颗心横排 + 右侧 X/100 数字。简化：满心 ❤️ / 空心 🤍（>=50% 显示满心）。

---

## 业务模块

### StatusTitle

- 文件：`app/src/components/ui/StatusTitle.tsx`
- 来自：抽自 HomeStage2 顶部状态区
- Figma：4 band 主形象帧 (5:45 / 5:14 / 1:305 / 1:332)
- 用在：HomeStage2
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | hp | number | ✓ | 0–100 |

  内部用 `getHpBand(hp)` 自动选 band，输出对应 title / subtitle / hint + mascot Image。文案/资源来自 `src/theme/hp.ts` 的 `HP_BANDS` 单一真源。

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
- 来自：抽自 HomeStage2 今日记录卡 / 用于 records 页 feed
- Figma：1:171 今日记录条目；1:79 records 页
- 用在：HomeStage2 今日记录区（数据接入待 §11.K 第 7 项）；后续 records 页
- Props:

  | name | type | required | 说明 |
  |---|---|---|---|
  | ts | number | | ms timestamp；无则不显示时间 |
  | text | string | ✓ | 文案正文 |
  | hpDelta | number | | 正绿负红 "血量±N" 标签；0 / 无则不显示 |
  | photoUri | string | | 食物图缩略；无则显示 mascot mini |

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

## 其它（v0.3 遗留，未抽到 ui/）

| 名称 | 路径 | 用在 | 备注 |
|---|---|---|---|
| `Mascot` | `app/src/components/Mascot.tsx` | `HomeStage1` | emoji 占位（stage prop 切 ⚡ 徽章）；stage 1 token 化时考虑迁移 |
| `WeekStrip` | `app/src/components/WeekStrip.tsx` | `HomeStage1` | 7 列周视图 |
| `HpBar` | `app/src/components/HpBar.tsx` | `HomeStage1` | 老 0-15 HP 进度条；新阈值已自动适配 |
| `MealCard` | `app/src/components/MealCard.tsx` | `HomeStage1` | 老餐次卡 |

> v0.4 §11.K 第 4 项 stage 1 主页 token 化时，决定这些是否迁移到 `ui/`。

---

## 截图

v0.5 加（每个组件配一张 simulator 截图 + Figma 帧对照）。
