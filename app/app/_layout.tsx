import "../global.css";
import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { useStore } from "@src/store/useStore";
import {
  ensureNotificationPermission,
  scheduleMealReminders,
} from "@src/services/notifications";
import { runMissedScan } from "@src/services/missedScan";
import { hpBandFromValue, pickDialogue } from "@src/data/dialogues";
import type { MealSlot } from "@src/types";

export default function RootLayout() {
  const router = useRouter();
  const rollDayIfNeeded = useStore((s) => s.rollDayIfNeeded);
  const onboardingDone = useStore((s) => s.onboardingDone);
  const schedules = useStore((s) => s.mealSchedules);
  const hp = useStore((s) => s.hp);

  useEffect(() => {
    rollDayIfNeeded();
  }, [rollDayIfNeeded]);

  // 三餐到点本地推送：onboarding 完成后，按当前 schedules 重新调度。
  // schedules 或 hp 变化 → reschedule（hp 影响选哪句台词作 body）
  useEffect(() => {
    if (!onboardingDone) return;
    let cancelled = false;
    (async () => {
      const granted = await ensureNotificationPermission();
      if (cancelled || !granted) return;
      const band = hpBandFromValue(hp);
      await scheduleMealReminders(schedules, (slot: MealSlot) => {
        const line = pickDialogue(band, slot);
        return line?.text ?? "该吃饭啦～";
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [onboardingDone, schedules, hp]);

  // 用户点通知 → 跳到 photo 屏（按 slot 拍照打卡）
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const slot = resp.notification.request.content.data?.slot;
      if (typeof slot === "string") {
        router.push({ pathname: "/(main)/photo", params: { slot } });
      }
    });
    return () => sub.remove();
  }, [router]);

  // Missed-meal 扫描（PRD §11.F.2）
  // app 启动 / 前台激活时跑：检测今日已过窗末仍未 done 的 slot → 自动 markMissed +
  // 推双消息 + 弹 missed modal。已经 missed 的 slot 不重复触发。
  useEffect(() => {
    const scanAndMaybePushModal = () => {
      const newMissed = runMissedScan();
      if (newMissed.length > 0) {
        // 多 slot 时只先弹第一个 modal；其它已经扣分 + 进 feed，下次 active 不重复弹
        router.push({
          pathname: "/(modal)/meal-missed",
          params: { slot: newMissed[0] },
        } as never);
      }
    };
    // 首次启动延迟一帧，等 router 挂载完
    const t = setTimeout(scanAndMaybePushModal, 0);
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") scanAndMaybePushModal();
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFF8F1" },
          }}
        >
          {/* (modal) group 用 modal presentation 呈现 */}
          <Stack.Screen
            name="(modal)"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
