# ADR-0006：本地通知 vs APNs 远程推送

- 日期：2025-09
- 状态：accepted（v0.5）；revisit v1.1
- 决策人：xin

## 背景

mealmate 要在三餐时间提醒用户吃饭。推送方式：
- **本地通知**：expo-notifications 客户端调度，不需服务器
- **APNs 远程**：服务器算时间 + 推 token → Apple → 用户机

## 决策

**v0.5 用 expo-notifications 本地通知。**

## 理由

- **没后端**：[ADR-0002](./0002-client-only-no-backend.md) 决定 client-only，APNs 需要后端持 device token + 调度
- **时间确定 + 用户私有**：每天 8:00 / 12:30 / 18:30 是用户设定的，机端就能算
- **离线可用**：本地通知不依赖网络
- **隐私**：device token 不外发，符合"数据不离开手机"原则
- **节省成本**：APNs 免费但需要后端机器，成本起步几十刀

## 实现要点

`services/notifications.ts`：
- app 启动时 `Notifications.requestPermissionsAsync()`
- 用户改 mealSchedule → `Notifications.cancelAllScheduledNotificationsAsync()` + 重排
- 每天 3 条 daily trigger（早午晚）
- 跨日 rollDayIfNeeded 触发时校验通知调度仍在

## 取舍

接受的缺点：
- **服务器无法控**：不能远端"今天临时不推"
- **不知道用户有没有点**：没回执
- **跨设备不同步**（v1.0 不支持多设备，影响小）
- **iOS 调度上限 64 个**（每天 3 条 daily 完全在内）

放弃的：
- 营销推送（"我们发版了！"）—— mealmate 是工具型 app，少推销少打扰
- 用户行为触发推送（"3 天没拍餐了"）—— 需后端，v1.1 再说

## v1.1+ 考虑

如果接 Apple Sign In + Worker 后端：
- 评估是否要补 APNs：场景是"7 天未活跃唤回"或"内容更新通知"
- mealmate 产品观克制，可能仍然不上 APNs（"少打扰是美德"）

## 后果

- v0.5 推送已跑通，TestFlight 内测员反馈正常
- 用户改时间立刻生效
- iOS 通知权限被拒的用户没有提醒 —— 应用内 home 卡 + missedScan 兜底

## 相关

- [ADR-0002](./0002-client-only-no-backend.md)
- [03-modules/reminder.md](../03-modules/reminder.md)
