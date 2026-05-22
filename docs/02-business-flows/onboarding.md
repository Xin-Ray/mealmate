# Onboarding

新用户首次启动 → 3 步引导 → 进 home + stage-1-start 欢迎屏。

```mermaid
flowchart TD
  Launch[App 启动] --> Check{onboardingDone?}
  Check -- 是 --> Home((main)/home)
  Check -- 否 --> Step1[1/3 eating<br/>选饮食状态]
  Step1 --> Step2[2/3 schedule<br/>三餐时间]
  Step2 --> Step3[3/3 name<br/>伙伴起名]
  Step3 --> Finish[finishOnboarding] --> Home
  Home --> StageStart[stage-1-start<br/>首次自动弹]
  StageStart -- "开始阶段 1" --> Home
```

## 正常
1. `app/index.tsx` 等 hydrate → `onboardingDone===false` 跳 `onboarding/eating`
2. eating → schedule（默认 07:30/11:30/17:30）→ name（默认"小满"）→ `finishOnboarding()`
3. 进 home → `(main)/_layout` 检测 `transitionsSeen` 没 `{1,'start'}` → 跳 `(stage)/stage-1-start`
4. 用户读完 → `markTransitionSeen(1,'start')` + 回 home

## 异常
| 异常 | 处理 |
|---|---|
| store hydrate 失败 | ActivityIndicator 一直转；重启 app |
| 中途杀 app | onboardingDone 仍 false，下次从 step 1 重来 |
| 通知权限拒绝 | `scheduleMealReminders` 静默失败，需用户手动去 iOS 设置 |

## 状态变化
- step 2：`mealSchedules` 按用户输入
- step 3：`robotName` + `onboardingDone=true`
- 看完 stage-1-start：`transitionsSeen += {stage:1, kind:'start'}`
- 初始 HP=60（stage 1 init），currentStage=1，todayMeals 全 pending
