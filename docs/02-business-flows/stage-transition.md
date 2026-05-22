# 阶段进阶 / 降级流程

HP 累到 100 → advanceStage（stage+1）；HP 降到 0 以下 → demoteStage。所有触发都走 `addHp(delta)` 统一边界。

## 流程图

```mermaid
flowchart TD
  Action[markMealDone / markMealMissed / addSnack /<br/>weight +0.5 / dev 触发] --> AddHp[addHp delta]
  AddHp --> Check{unclamped HP}
  Check -- '>=100' --> Advance
  Check -- '<0' --> Demote
  Check -- 其它 --> Clamp[hp = clamp 0-100]
  Advance[advanceStage] --> AdvLogic{currentStage >= 5?}
  AdvLogic -- 是 --> AdvNoop[no-op<br/>已到顶]
  AdvLogic -- 否 --> AdvStep[currentStage += 1<br/>hp = 50<br/>companionLv += 1<br/>push pending stage:旧 kind:end]
  Demote[demoteStage] --> DemLogic{currentStage > 1?}
  DemLogic -- 是 --> DemDown[currentStage -= 1<br/>hp = 90<br/>push pending stage:旧 kind:demote]
  DemLogic -- 否 --> DemStay[stage 不变<br/>hp = 90<br/>push pending stage:1 kind:demote]
  AdvStep --> Layout
  DemDown --> Layout
  DemStay --> Layout
  Layout[(main)/_layout useEffect] --> Consume{transitionsPending 队首}
  Consume -- 有 --> Push[router.replace<br/>/(stage)/stage-N-end 或 -demote]
  Push --> Stage[(stage) page<br/>slide_from_right]
  Stage -- 完成 / 我知道了 / 继续 --> Replace[router.replace<br/>/(main)/home]
  Replace --> Home((main)/home)
  Consume -- 空 --> SeenCheck{stage 1 start 未看?}
  SeenCheck -- 是 --> Stage1Start[(stage)/stage-1-start]
  Stage1Start -- 开始阶段 1 --> MarkSeen[markTransitionSeen 1 start]
  MarkSeen --> Home
```

## 正常流程：进阶

1. 用户 markMealDone（拍照 +5 HP）或 addSnack（+10 HP）等任何加 HP 操作
2. `addHp(+delta)` 内部检测 unclamped >= 100 → 调 `advanceStage()`
3. `advanceStage`：
   - 检查 currentStage < 5（>=5 已到顶 no-op）
   - `currentStage += 1`
   - `hp = HP_INITIAL_STAGE_2 (50)` if newStage===2 else `hp = 50`（stage 3-5 fallback）
   - `companionLv += 1`
   - `transitionsPending.push({stage: 旧 stage, kind:'end'})`
4. `(main)/_layout` useEffect 检测 transitionsPending 变 → setTimeout(0) 跑：
   - 取队首 next（`{stage: 旧, kind:'end'}`）
   - `router.replace('/(stage)/stage-N-end')`
   - `consumeTransition()` 立刻把队首 pop（防重复）
5. (stage)/stage-N-end 屏渲染：阶段名 / 完成感言 / 下一阶段预告 / "完成"按钮
6. 用户点"完成" → `router.replace('/(main)/home')`
7. (main)/_layout useEffect 再跑：队列空 + stage 1 start 已看 → 不弹任何屏 → 用户停在 home

## 正常流程：降级

1. 用户 markMealMissed（-10 HP）或 dev 触发 demote
2. `addHp(-delta)` 检测 unclamped < 0 → 调 `demoteStage()`
3. `demoteStage`：
   - stage > 1 → `currentStage -= 1`, hp = 90, `transitionsPending.push({stage:旧, kind:'demote'})`
   - stage = 1 → 不变 stage, hp = 90, `transitionsPending.push({stage:1, kind:'demote'})`（**特殊 support 调**）
4. `(main)/_layout` useEffect 同上 → push `(stage)/stage-N-demote`
5. **Stage 2-5 demote 屏**：橘色调"回到阶段 N-1，请继续努力"；用户点"继续" → 回 home
6. **Stage 1 demote 屏**：support 调"需要支持"+ 建议联系医生 / 营养师（[PRD §11.L](../PRD.md)）；用户点"我知道了" → 回 home

## 正常流程：stage-1-start（新用户欢迎）

1. 新用户首次完成 onboarding → `(main)/home`
2. `(main)/_layout` useEffect 检测 transitionsSeen 没 `{stage:1, kind:'start'}` → `router.replace('/(stage)/stage-1-start')`
3. 用户读 stage 1 介绍 / 规则 / 鼓励文案
4. 点"开始阶段 1" → `markTransitionSeen(1, 'start')` → `router.replace('/(main)/home')`
5. 以后再进 home，seen 检查通过 → 不弹

## 异常流程

| 异常 | 处理 |
|---|---|
| **HP 短时间频繁变更**（理论上）| transitionsPending 是数组 push，可以排队；layout useEffect 一次 push 一个并 consume，剩下的下一轮渲染再 push |
| **app 杀掉时 pending 不为空** | persist 持久化，下次启动 `(main)/_layout` 仍 consume 队列 |
| **HP 同时跨越 100 和 <0**（不可能，addHp 一次 delta 不会同时跨两边）| 单次 delta 决定走 advance / demote / clamp 一条路径 |
| **stage 5 advance** | advanceStage 内 `if (currentStage >= 5) return` no-op，pending 不 push，用户停留 stage 5 |
| **stage 1 demote 重复触发** | 每次都 push pending（dialogueHistory 也加 failure 留账）；可能看到多次 modal 但每次都是 stage 1 不变 stage |
| **dev 面板手动 setStage / setHp** | `__dev_setHp(n)` 直接 set 不走 addHp 边界 → 不会触发 advance/demote（如需触发，调 advanceStage/demoteStage 直接 action） |

## 状态变化

```
advanceStage:
  currentStage: N → N+1
  hp: → 50
  companionLv: +1
  transitionsPending: 加 {stage:N, kind:'end'}
demoteStage (stage>1):
  currentStage: N → N-1
  hp: → 90
  transitionsPending: 加 {stage:N, kind:'demote'}
  dialogueHistory: 加 1 条 kind='failure' body='阶段 N 失败一次' stageWhenFailed=N
demoteStage (stage=1):
  currentStage: 不变 1
  hp: → 90
  transitionsPending: 加 {stage:1, kind:'demote'}
  dialogueHistory: 加 1 条 kind='failure' stageWhenFailed=1
stage-N-end CTA 点击:
  无 store 变化（队列已在 advance 时 consume）
  router.replace 跳 home
stage-1-start CTA 点击:
  transitionsSeen: 加 {stage:1, kind:'start'}
  router.replace 跳 home
```

## 注意事项

- **Plan B 重构（v0.5）**：(stage) screens 移出 (modal) group，独立路由 + page presentation（slide from right），不是 modal 弹起 —— sticky footer 按钮永远可见
- **Stage 3/4/5 advance 逻辑未实施**：advanceStage 支持到 stage 5，但 markMealDone 内部从来不会让 stage 2 advance 到 3（没有"stage 2 通关条件"判定），目前只 stage 1→2 真实跑通；stage 3-5 的过渡屏是预制好的 UI，等 PRD 决策后业务逻辑接入
- **NextStepCard 视觉降级**：stage-N-end 屏里"下一阶段预告"卡用浅米色 + 无 → 箭头，避免被误以为按钮（[Plan B bug3 fix](../README.md)）
- **failure dialogue 记账**：demote 时落 dialogueHistory `kind='failure'`，feed 渲染暖橘卡 + 💭 icon（区别 missed 的红 badge）

## 模块不负责

- 单次 HP 计算（+/- 多少）—— [meal-photo.md](./meal-photo.md) / [missed-meal.md](./missed-meal.md) / [snack.md](./snack.md)
- 五阶段具体内容 / 规则 —— [PRD §四](../PRD.md)
- stage 屏布局 / 样式 —— [03-modules/stage-transitions.md](../03-modules/stage-transitions.md)
