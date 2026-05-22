## 模块名称
settings（我的 tab）

## 模块目标
用户偏好设置 + dev 调试面板 + 数据导出 / 重置。

## 负责人
xin

## 依赖模块
- [store.md](./store.md)：所有 user-tunable 字段（gentleMode / skipWeightPhoto / mealSchedules / userName）
- dev panel：直接调 store dev actions（`__dev_setHp` / `__dev_setStage` / `__dev_pushDialogue` 等）

## 对外接口
- 路由：`/(main)/settings`
- store action：
  - `setGentleMode(boolean)`
  - `setSkipWeightPhoto(boolean)`
  - `setMealSchedule(slot, "HH:mm")`
  - `setUserName(string)`
  - `resetAll()` —— 慎用，清 mealmate-store
- dev actions（**仅 __DEV__** 暴露）：`__dev_setHp` / `__dev_setStage` / `__dev_triggerAdvance` / `__dev_triggerDemote` / `__dev_addMockDialogue`

## 核心状态
- `gentleMode`：HP -10 → -5 / -0.5 → -0.25（影响 markMealMissed 扣分）
- `skipWeightPhoto`：weight-entry modal 跳过拍照步骤
- `mealSchedules`：{ breakfast: "08:00", lunch: "12:30", dinner: "18:30" }
- `userName`：onboarding 录入，dialogue 文案插值用

## 核心逻辑
- **设置区**：toggle / time picker / text input
- **数据区**：导出 JSON（mealmate-store snapshot）/ 全部清空
- **关于区**：版本号 / 联系邮箱 / 隐私政策
- **Dev 区**（__DEV__ only）：直接调 dev actions（一键 setHp=100 → 触发 advance 测试）

## 异常情况
| 异常 | 处理 |
|---|---|
| mealSchedule 改时间 | 当日已 done 的 slot 不变，未 done 的 reminder window 跟随重新计算 |
| 用户改 userName 为空 | onSave 校验非空（防 dialogue 模板插值"，加油"开头） |
| dev 暴露给生产 | `__DEV__` 守门；release build 整块 if 不渲染 |
| 全部清空 | 二次确认 Alert + 清 AsyncStorage 后强制重启回 onboarding |
| gentleMode 切换 | 过去已扣的 HP 不追溯改，只影响未来 |

## 注意事项
- **gentle mode 不追溯**：切开关只改未来扣分，已发生的 mealRecord.hpDelta 不动
- 全部清空走 AsyncStorage.removeItem('mealmate-store') —— persist 监听到自动 re-init
- dev panel 在 production build 完全消失（不是 hide），避免误触

## 模块不负责什么
- 三餐时间业务规则 → [reminder.md](./reminder.md)（settings 只存配置，规则在 reminder）
- HP / stage 真实业务调用 → [store.md](./store.md)
- 推送通知调度 → `services/notifications.ts`
- 云同步 / 多端 → v1.1+ Apple Sign In
