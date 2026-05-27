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

// 每餐两条通知：到点 + 窗末前 30min（= schedule + 60min）。Issue #6(b)
const idForSlot = (slot: MealSlot) => `mealmate.meal.${slot}`;
const idForSlotEnd = (slot: MealSlot) => `mealmate.meal.${slot}.end30`;

// 窗末提醒文案池（按 slot 切分；不引 random 是为了"调度时"的稳定）
const END30_BODY: Record<MealSlot, string> = {
  breakfast: "早餐窗口还有 30 分钟，吃了的话别忘了记录哦~",
  lunch: "午餐窗口还有 30 分钟，吃了的话别忘了记录哦~",
  dinner: "晚餐窗口还有 30 分钟，吃了的话别忘了记录哦~",
};

// schedule + 60min = windowEnd - 30min。返回 hour/minute（24h 制）。
const computeEnd30 = (hhmm: string): { hour: number; minute: number } => {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr ?? "0", 10) || 0;
  const m = parseInt(mStr ?? "0", 10) || 0;
  const total = h * 60 + m + 60; // +60min
  return {
    hour: Math.floor(total / 60) % 24,
    minute: total % 60,
  };
};

// 全局 handler：app 在前台时收到推送如何处理（这里选择仍然弹横幅）
// expo-notifications 新版用 shouldShowBanner / shouldShowList 替代了 shouldShowAlert
Notifications.setNotificationHandler({
  handleNotification: async () => ({
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
  // 简化策略：清掉所有 → 重新调度 6 个 DAILY（3 餐 × 2：到点 + 窗末前 30min）。
  // pending 数 = 6，远低于 iOS 的 64 上限。Issue #6(b) 新需求。
  await Notifications.cancelAllScheduledNotificationsAsync();

  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  for (const slot of slots) {
    const parts = schedules[slot].split(":");
    const hour = parseInt(parts[0] ?? "0", 10) || 0;
    const minute = parseInt(parts[1] ?? "0", 10) || 0;
    // 1) 到点提醒
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
    // 2) 窗末前 30 分钟（= schedule + 60min）的二次提醒
    //    本地通知不能条件触发，统一推；如果用户已经拍照，看到也无伤大雅
    const end30 = computeEnd30(schedules[slot]);
    await Notifications.scheduleNotificationAsync({
      identifier: idForSlotEnd(slot),
      content: {
        title: `${SLOT_LABEL[slot]}窗口还有 30 分钟`,
        body: END30_BODY[slot],
        data: { slot, type: "meal_reminder_end30" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: end30.hour,
        minute: end30.minute,
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
