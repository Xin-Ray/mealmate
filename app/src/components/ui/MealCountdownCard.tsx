import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import Card from "@src/components/ui/Card";
import PrimaryButton from "@src/components/ui/PrimaryButton";
import { colors } from "@src/theme/tokens";
import type { MealSchedule, MealSlot, TodayMeals } from "@src/types";

// @deprecated v0.4 hotfix（2026-05-07）：HomeStage1/2 改用 <HomeMealStatusSlot> +
// <MealReminderCard> + <MealIncompleteCard> 三态生命周期管理。本组件保留作历史
// 参考（pre-hotfix 行为：始终显示，含"已记录 ✓" disabled 态）；如确认无引用，
// 下次清理可删。
//
// 下一餐倒计时卡（HomeStage2 用）。
// 内部计算 meal window（settings 提醒时间 ±90min, PRD §11.F.3）+ 每秒 tick。
//   窗内 → "X时间到啦" + 倒计时到窗末
//   窗外今日 → "距离X还有" + 倒计时到下一餐窗起
//   今日三餐都过了 → "明天早餐" + 倒计时到明日窗起

type Props = {
  schedules: MealSchedule;
  todayMeals: TodayMeals;
  onCapture: (slot: MealSlot) => void;
};

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const WINDOW_MIN = 90;

type SlotInfo = {
  slot: MealSlot;
  windowStart: Date;
  windowEnd: Date;
};

const parseHHmm = (hhmm: string, baseDate: Date): Date => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(baseDate);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const nextDayBreakfast = (
  schedules: MealSchedule,
  now: Date
): SlotInfo => {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const center = parseHHmm(schedules.breakfast, tomorrow);
  return {
    slot: "breakfast",
    windowStart: new Date(center.getTime() - WINDOW_MIN * 60 * 1000),
    windowEnd: new Date(center.getTime() + WINDOW_MIN * 60 * 1000),
  };
};

const getMealWindowState = (
  schedules: MealSchedule,
  now: Date
): { current: SlotInfo | null; next: SlotInfo } => {
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  const todayInfos: SlotInfo[] = slots.map((slot) => {
    const center = parseHHmm(schedules[slot], now);
    return {
      slot,
      windowStart: new Date(center.getTime() - WINDOW_MIN * 60 * 1000),
      windowEnd: new Date(center.getTime() + WINDOW_MIN * 60 * 1000),
    };
  });

  const current = todayInfos.find(
    (info) => now >= info.windowStart && now < info.windowEnd
  );
  if (current) {
    const idx = slots.indexOf(current.slot);
    const next =
      idx < slots.length - 1
        ? todayInfos[idx + 1]
        : nextDayBreakfast(schedules, now);
    return { current, next };
  }

  const futureToday = todayInfos.find((info) => now < info.windowStart);
  if (futureToday) return { current: null, next: futureToday };

  return { current: null, next: nextDayBreakfast(schedules, now) };
};

const fmtCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function MealCountdownCard({
  schedules,
  todayMeals,
  onCapture,
}: Props) {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const windowState = useMemo(
    () => getMealWindowState(schedules, now),
    [schedules, now]
  );
  const countdownTarget = windowState.current
    ? windowState.current.windowEnd
    : windowState.next.windowStart;
  const countdownText = fmtCountdown(countdownTarget.getTime() - now.getTime());

  const ctaSlot: MealSlot = windowState.current
    ? windowState.current.slot
    : windowState.next.slot;
  const ctaIsTomorrow =
    !windowState.current &&
    windowState.next.slot === "breakfast" &&
    windowState.next.windowStart.getDate() !== now.getDate();
  const cardTitle = windowState.current
    ? `${SLOT_LABEL[ctaSlot]}时间到啦!`
    : ctaIsTomorrow
    ? "明天早餐"
    : `距离${SLOT_LABEL[ctaSlot]}还有`;
  const alreadyDone = windowState.current
    ? todayMeals[ctaSlot] === "done"
    : false;

  return (
    <Card style={{ marginTop: 16, paddingVertical: 20 }}>
      <Text style={{ fontSize: 18, color: colors.ink.primary }}>
        {cardTitle}
      </Text>
      <Text
        className="font-semibold mt-2"
        style={{ fontSize: 44, color: colors.brand.greenDark, lineHeight: 52 }}
      >
        {countdownText}
      </Text>
      <View className="mt-4">
        <PrimaryButton
          label={alreadyDone ? "已记录 ✓" : "去拍照"}
          onPress={() => onCapture(ctaSlot)}
          disabled={alreadyDone}
        />
      </View>
      <Text
        className="text-center mt-3"
        style={{ fontSize: 12, color: colors.ink.muted }}
      >
        超过时间将无法获得额外奖励哦~
      </Text>
    </Card>
  );
}
