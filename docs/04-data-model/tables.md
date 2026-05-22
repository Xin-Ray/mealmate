# Store Schema 详表 + 迁移历史

`mealmate-store` 是单一 JSON，AsyncStorage 持久化。schema 通过 zustand persist `version` + `migrate` 维护。

## 当前 schema v9

```ts
{
  version: 9,
  state: {
    // 用户进度
    currentStage: number,           // 1..5
    hp: number,                     // 0..100
    companionLv: number,
    userName: string,
    eatingProfile: 'gain' | 'maintain' | 'lose',
    isOnboarded: boolean,

    // 当日 / 跨日
    todayKey: string,               // 'YYYY-MM-DD'
    mealSchedules: {
      breakfast: string,            // 'HH:mm'
      lunch: string,
      dinner: string,
    },
    todayMeals: Record<MealSlot, 'pending' | 'done' | 'missed'>,
    mealHistory: Record<string, todayMeals>, // 归档昨日

    // 历史 list
    mealRecords: MealRecord[],
    dialogueHistory: DialogueEntry[],
    weightHistory: WeightRecord[],
    fullnessHistory: FullnessRecord[],

    // 过渡队列
    transitionsPending: Array<{ stage: number, kind: 'end' | 'demote' }>,
    transitionsSeen: Array<{ stage: number, kind: 'start' | 'end' | 'demote' }>,

    // 设置
    settings: {
      gentleMode: boolean,
      skipWeightPhoto: boolean,
    },
  }
}
```

## 字段详表

### MealRecord

| 字段 | 类型 | 含义 |
|---|---|---|
| id | string | uuid |
| status | `'done' \| 'missed'` | 状态 |
| mealSlot | `'breakfast' \| 'lunch' \| 'dinner'` | 餐次 |
| ts | number | epoch ms |
| hpDelta | number | +5 / -10 / -5（gentle） |
| photoUri | string? | done 时有；missed 无 |
| acknowledged | boolean? | missed 才用，true 后 home 不显示 incomplete card |

### DialogueEntry

| 字段 | 类型 | 含义 |
|---|---|---|
| id | string | uuid |
| kind | `'meal_done' \| 'meal_missed' \| 'encourage' \| 'remind' \| 'snack_done' \| 'failure' \| 'mock'` | discriminated |
| body | string | 文案（含 userName 插值） |
| mealSlot | string? | meal_done/meal_missed/encourage/remind 有 |
| hpDelta | number? | meal_done/meal_missed/snack_done 有 |
| photoUri | string? | meal_done/snack_done 有 |
| stageWhenFailed | number? | failure 专用，stage 1 demote 时记录 |
| ts | number | epoch ms |

### WeightRecord

| 字段 | 类型 | 含义 |
|---|---|---|
| id | string | uuid |
| kg | number | 20..250 |
| date | string | 'YYYY-MM-DD'，每日唯一 |
| photoUri | string? | 可空 |
| ts | number | epoch ms |

### FullnessRecord

| 字段 | 类型 | 含义 |
|---|---|---|
| id | string | uuid |
| mealSlot | string | breakfast/lunch/dinner |
| date | string | 'YYYY-MM-DD' |
| rating | `3 \| 5 \| 8` | 30% / 60% / 100% |
| ts | number | epoch ms |

## 迁移历史

| 版本 | 改动 | 说明 |
|---|---|---|
| v1 | 初版 | currentStage / hp / mealSchedules / todayMeals / userName |
| v2 | + dialogueHistory | 鼓励 / 错过 dialogue 历史 |
| v3 | + mealRecords | 餐次条目（done/missed） |
| v4 | + companionLv / + transitionsPending | 阶段进阶 |
| v5 | + weightHistory / + fullnessHistory | stage 2 数据 |
| v6 | + settings.gentleMode | 温柔模式 |
| v7 | + mealHistory（按日归档）/ + todayKey | 跨日 rollDayIfNeeded |
| v8 | + settings.skipWeightPhoto | 跳过称重照片 |
| v9 | + transitionsSeen / DialogueEntry.stageWhenFailed | Plan B v0.5 重构 |
| v10（snack 合并后） | + DialogueKind 'snack_done' | snack card |

每次升级 zustand `migrate(persisted, oldVersion)` 函数补默认值，保留旧字段。

## 不变量校验

migrate 函数 + addHp / advanceStage / demoteStage 内部断言：
- `hp ∈ [0, 100]`
- `currentStage ∈ [1, 5]`
- 同 (slot, date) 在 mealRecords / fullnessHistory 最多 1 条
- 同 date 在 weightHistory 最多 1 条

## 大小预估

中度活跃用户：3 meal/day + 2 dialogue/meal + 1 weight/day + 1 fullness/meal
- mealRecords: ~3 entries/day → 1095/年
- dialogueHistory: ~10 entries/day（含 reminder / encourage）→ 3650/年
- weightHistory: ~365 entries/年
- fullnessHistory: ~1095 entries/年

按平均每条 200B 估算，1 年约 1.2MB。AsyncStorage 单 key 限制 ~6MB（iOS 默认），3-5 年无压力。

## 后续

- v1.1+ 加云同步：Apple Sign In + Cloudflare D1，按 user_id 拆表
- 当前**完全本地**，重装 app 数据丢失（PRD §10 提示）
