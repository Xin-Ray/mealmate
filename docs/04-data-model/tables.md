# 数据模型

mealmate 是 client-only，"数据库"是 AsyncStorage 里的单个 JSON `mealmate-store`。

## Source of truth = 代码

| 想看什么 | 看哪 |
|---|---|
| 字段定义 / TypeScript 类型 | **`app/src/types/index.ts`** —— DialogueKind / MealRecord / WeightRecord / FullnessRecord / DialogueEntry 等 |
| State shape + 默认值 + 全部 action | `app/src/store/useStore.ts` |
| Migrate 函数（v1 → v9） | `useStore.ts` 里 persist 中间件 `migrate` 函数 |
| 不变量保护 | `addHp / advanceStage / demoteStage` action 内的 clamp + 触发 |

文档不重复维护一份详细字段表 —— 代码就是 source of truth，注释直接看。

## State shape（简表）

```
hp                              0..100 单一血量
currentStage                    1..5
companionLv
userName / robotName
eatingProfile                   gain | maintain | lose
isOnboarded

todayKey / mealSchedules / todayMeals    今日餐次状态
mealHistory                     按日归档昨日

mealRecords[]                   餐打卡条目（done | missed）
dialogueHistory[]               mascot 所有发言（kind discriminated union）
weightHistory[]                 体重记录（每日唯一）
fullnessHistory[]               饱腹度评分（每 slot/date 唯一）

transitionsPending[]            待消费过渡 { stage, kind: end|demote }
transitionsSeen[]               已看过渡 { stage, kind: start|... }

settings.gentleMode             错过扣分 -10 → -5
settings.skipWeightPhoto        体重录入跳过拍照
```

## 不变量

- `hp ∈ [0, 100]` —— 由 `addHp` clamp 保证
- `currentStage ∈ [1, 5]`
- 每个 `(slot, date)` 在 mealRecords / fullnessHistory ≤ 1 条
- 每个 `date` 在 weightHistory ≤ 1 条
- `todayMeals[slot]==='done' ⇒ 存在对应 MealRecord(status='done', mealSlot=slot)`

## 持久化

- key: `mealmate-store`
- storage: AsyncStorage
- version: 9
- migrate: v1 → v9 每升级一个补丁函数（看 useStore.ts）；schema 升版**必须**加 migrate
- partialize: 当前不剔（整 state 持久化）

## 数据大小

中度活跃 1 年约 1.2MB（mealRecords + dialogueHistory + weightHistory + fullnessHistory）。AsyncStorage 单 key ~6MB（iOS），3-5 年无压力。dialogueHistory 后续考虑保留最近 90 天。

## 删除策略

全 append-only，用户不能删单条（防作弊 + 留档）。唯一删入口是 settings 全部清空 → `resetAll()` 清整个 mealmate-store。
