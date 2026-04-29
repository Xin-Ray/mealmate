// 本地推送（local notifications）封装
//
// - 三餐到点用 DAILY trigger 调度（iOS 系统层面每天重复，app 关掉也会推）
// - 通知 body 在「调度时」就写死，HP 变化不会回头改已调度的；下次 onboardingDone/schedules/hp
//   触发 _layout.tsx 的 useEffect 时会重新 schedule
// - test 入口：5 秒后触发一条，给 settings 开发者面板用
//
// ⚠️ 真机端到端验证 TODO：
//   - iOS Simulator 对 DAILY trigger 支持有 quirk（系统时间快进/休眠时偶尔跳过）
//   - 真机首次安装弹权限对话框
//   - 通知锁屏样式、声音、振动
//   见 docs/dev-log.md "B1 真机验证 TODO"

import * as Notifications from "expo-notifications";
import type { MealSchedule, MealSlot } from "@src/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const idForSlot = (slot: MealSlot) => `mealmate.meal.${slot}`;

// 全局 handler：app 在前台时收到推送如何处理（这里选择仍然弹横幅）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (settings.canAskAgain === false) return false;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

export async function scheduleMealReminders(
  schedules: MealSchedule,
  dialogueFor: (slot: MealSlot) => string
): Promise<void> {
  // 简化策略：清掉所有 → 重新调度 3 个 DAILY。pending 数始终 ≤ 3，远低于 iOS 的 64 上限
  await Notifications.cancelAllScheduledNotificationsAsync();

  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  for (const slot of slots) {
    const parts = schedules[slot].split(":");
    const hour = parseInt(parts[0] ?? "0", 10) || 0;
    const minute = parseInt(parts[1] ?? "0", 10) || 0;
    await Notifications.scheduleNotificationAsync({
      identifier: idForSlot(slot),
      content: {
        title: `${SLOT_LABEL[slot]}时间到啦`,
        body: dialogueFor(slot),
        data: { slot, type: "meal_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function triggerTestNotification(
  slot: MealSlot,
  body: string,
  delaySeconds = 5
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${SLOT_LABEL[slot]}（测试）`,
      body,
      data: { slot, type: "meal_reminder", test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });
}
