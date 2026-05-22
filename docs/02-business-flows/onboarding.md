# Onboarding 流程

新用户首次启动 → 3 步引导 → 进 home。

## 流程图

```mermaid
flowchart TD
  Launch([App 启动]) --> Hydrate{store hydrated?}
  Hydrate -- 否 --> Loading[加载中...]
  Hydrate -- 是 --> Check{onboardingDone?}
  Check -- 是 --> Home((main)/home)
  Check -- 否 --> Step1[onboarding/eating<br/>选饮食状态<br/>正常 / 想多吃 / 不太规律]
  Step1 -- 下一步 --> Step2[onboarding/schedule<br/>三餐时间<br/>默认 07:30 / 11:30 / 17:30]
  Step2 -- 下一步 --> Step3[onboarding/name<br/>给伙伴起名<br/>默认"小满"]
  Step3 -- 下一步 --> Finish[finishOnboarding<br/>onboardingDone=true]
  Finish --> Home
  Home --> StageStart[stage-1-start 自动弹<br/>首次进 home + transitionsSeen 无 1-start]
  StageStart -- 开始阶段 1 --> Home
```

## 正常流程

1. 用户首次启动 app → `app/index.tsx` 等 `useStore.persist.hasHydrated()`
2. `onboardingDone === false` → `<Redirect href="/onboarding/eating" />`
3. **步骤 1/3 — eating**：选饮食状态（"正常 / 想多吃 / 不太规律"），点"下一步"
4. **步骤 2/3 — schedule**：3 个 DateTimePicker 设三餐时间（默认 07:30 / 11:30 / 17:30），点"下一步"
5. **步骤 3/3 — name**：TextInput 给伙伴起名（默认"小满"），点"下一步" → `finishOnboarding()` → `onboardingDone=true`
6. 路由跳到 `(main)/home`
7. `(main)/_layout` useEffect 检测 `transitionsSeen` 无 `{stage:1, kind:'start'}` → `router.replace('/(stage)/stage-1-start')` 弹欢迎屏
8. 用户读 stage-1-start 屏 → 点"开始阶段 1" → `markTransitionSeen(1,'start')` + `router.replace('/(main)/home')`

## 异常流程

| 异常 | 处理 |
|---|---|
| store hydrate 失败 | `<ActivityIndicator />` 一直转，需要重启 app；persist migrate 兼容 v1→v9 老数据，老用户升级不会丢 |
| 用户在 step 2 输入非法时间 | DateTimePicker 系统级，输入是 Date 对象，不会非法 |
| 用户在 step 3 输入空名字 | `setRobotName(n.trim() \|\| "小满")` 兜底默认值 |
| 用户在 onboarding 中途杀 app | 重启后 `onboardingDone` 仍为 false，从 step 1 重新开始（已填的 schedule / name 也丢失） |
| 用户从 stage-1-start 屏退出（理论上点不到关闭，全屏 page）| markTransitionSeen 未调 → 下次进 home 还会再弹 |
| 通知权限拒绝 | onboarding 完成后 `scheduleMealReminders` 静默失败，三餐推送不会响（用户需手动开权限） |

## 状态变化

```
初始 state:
  onboardingDone: false
  hp: 60（HP_INITIAL_STAGE_1）
  currentStage: 1
  robotName: "小满"
  mealSchedules: { breakfast: "07:30", lunch: "11:30", dinner: "17:30" }
  todayMeals: { breakfast/lunch/dinner: "pending" }
  transitionsSeen: []
  ... 其它历史 []

step 1 完成: 无 state 变化（饮食状态选项只是 UX 信号，不存）
step 2 完成: mealSchedules 按用户输入
step 3 完成: robotName + onboardingDone=true
进 home + 看完 stage-1-start: transitionsSeen += {stage:1, kind:'start'}
```

## 注意事项

- v0.3 时有第 4 屏 ChatGPT 登录，**v0.4 §11.K 第 2 项删了**（key 暴露安全考虑）
- 老用户升级（已 onboarded）→ migrate 后 `onboardingDone` 保持 true，不会重走 onboarding
- "重置 onboarding"（dev 面板 / 设置"删除账号"）= `resetAll()` 清全部 + `onboardingDone=false` → 跳回 onboarding step 1

## 模块不负责

- 注册 / 登录 / 账号系统（v1.1+ Apple Sign In）
- 引导后的 stage 1 操作说明 —— 那是 stage-1-start 屏的职责（详 [stage-transition.md](./stage-transition.md)）
- 推送权限请求 —— `RootLayout` `ensureNotificationPermission` 在 onboardingDone 后才调
