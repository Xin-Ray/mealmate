# 阶段进阶 / 降级

HP 累到 100 → advanceStage；HP 降到 0 以下 → demoteStage。统一走 `addHp(delta)` 边界。

```mermaid
flowchart TD
  Action[markMealDone / markMealMissed / addSnack /<br/>+0.5 体重 / dev] --> AddHp[addHp delta]
  AddHp --> Check{unclamped}
  Check -- ">=100" --> Adv[advanceStage]
  Check -- "<0" --> Dem[demoteStage]
  Check -- 其他 --> Clamp[clamp 0-100]
  Adv --> AdvLogic{stage>=5?}
  AdvLogic -- 是 --> Noop[no-op 已到顶]
  AdvLogic -- 否 --> AdvStep[stage+=1, hp=50,<br/>companionLv+=1,<br/>push pending stage:旧 kind:end]
  Dem --> DemLogic{stage>1?}
  DemLogic -- 是 --> DemDown[stage-=1, hp=90,<br/>push pending stage:旧 kind:demote]
  DemLogic -- 否 --> DemStay[stage=1, hp=90,<br/>push pending stage:1 kind:demote<br/>+failure dialogue]
  AdvStep & DemDown & DemStay --> Consume[(main)/_layout useEffect<br/>取队首 → router.replace<br/>/(stage)/stage-N-end 或 -demote]
  Consume --> Stage[stage page<br/>slide_from_right] -- 完成 / 我知道了 --> Home((main)/home)
  Home --> Seen{stage 1 start 未看?}
  Seen -- 是 --> Start[(stage)/stage-1-start] -- "开始阶段 1" --> Mark[markTransitionSeen] --> Home
```

## 正常 — Advance
1. 任何 +HP action → `addHp(delta)` 内 unclamped>=100 → `advanceStage()`
2. stage<5 → stage+=1, hp=50, companionLv+=1, push pending `{旧, 'end'}`
3. `(main)/_layout` useEffect 检测 pending → `router.replace('/(stage)/stage-N-end')` + `consumeTransition()`
4. 用户点"完成" → `router.replace('/(main)/home')`

## 正常 — Demote
1. -HP action → unclamped<0 → `demoteStage()`
2. stage>1 → stage-=1, hp=90, push pending `{旧, 'demote'}`
3. stage=1 → 不变 stage, hp=90, push pending `{1, 'demote'}`（**support 调** 建议医生 / 营养师，PRD §11.L）
4. 推 `(stage)/stage-N-demote` → 用户点"继续" → 回 home

## 正常 — Stage 1 Start
1. 新用户 onboarding 后进 home，`transitionsSeen` 无 `{1,'start'}` → 推 `(stage)/stage-1-start`
2. 用户点"开始阶段 1" → `markTransitionSeen(1,'start')` + 回 home

## 异常
| 异常 | 处理 |
|---|---|
| HP 短时间多次变更 | pending 是数组，排队消费；layout useEffect 一次 push 一个 |
| app 杀掉时 pending 非空 | persist 持久化，下次启动继续消费 |
| stage 5 advance | `if (currentStage >= 5) return` no-op，pending 不 push |
| stage 1 重复 demote | 每次 push 一次 `{1,'demote'}`（dialogueHistory 加 failure 留账）|
| dev setHp / setStage | 不走 addHp 边界 → 不触发 advance/demote |

## 状态变化
- advance: currentStage +1, hp=50, companionLv +1, pending +1
- demote (stage>1): currentStage -1, hp=90, pending +1, dialogueHistory +failure
- demote (stage=1): stage 不变, hp=90, pending +1, dialogueHistory +failure
- stage page CTA：无 store 变化（队列已 consume）
- stage-1-start CTA：transitionsSeen +1

**Plan B v0.5**：(stage) 从 (modal) 移出，独立路由 + page presentation slide_from_right，**不是 modal** —— sticky 按钮永远可见。

**Stage 3-5 业务逻辑未接入**：advanceStage 支持到 5，但 markMealDone 不会让 stage 2→3（PRD 决策中），目前只 stage 1→2 真实跑通。
