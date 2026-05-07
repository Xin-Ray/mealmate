import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import Mascot from "@src/components/Mascot";
import HpHearts from "@src/components/home/HpHearts";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import type { MealSlot, MealSchedule } from "@src/types";

// Stage 2 主页（v0.4 §11.B）
// 视觉重做：状态大标题 / HP 心形 / 体重模块 / 倒计时 / 今日记录

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

// 时间窗：settings 提醒时间 ±90min（PRD §11.F.3）
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

// 当前时间在哪个 slot 的窗口内？或下一个 slot 是哪个？
const getMealWindowState = (
  schedules: MealSchedule,
  now: Date
): {
  current: SlotInfo | null; // 当前在窗口内
  next: SlotInfo;            // 下一个（可能是今日某餐或明日早餐）
} => {
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

  // 不在任何窗口内：找下一个未来窗口
  const futureToday = todayInfos.find((info) => now < info.windowStart);
  if (futureToday) return { current: null, next: futureToday };

  // 今天三餐窗口都过了 → 下一个是明天早餐
  return { current: null, next: nextDayBreakfast(schedules, now) };
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

const fmtCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const fmtWeightTime = (ts: number): string => {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mn}`;
};

export default function HomeStage2() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const robotName = useStore((s) => s.robotName);
  const todayMeals = useStore((s) => s.todayMeals);
  const schedules = useStore((s) => s.mealSchedules);
  const weightHistory = useStore((s) => s.weightHistory);

  // 倒计时：每秒 tick
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const band = getHpBand(hp);
  const { title, subtitle, hint } = band;

  // 体重模块
  const lastWeight = weightHistory[weightHistory.length - 1];
  const prevWeight =
    weightHistory.length >= 2 ? weightHistory[weightHistory.length - 2] : null;
  const weightDiff =
    lastWeight && prevWeight ? lastWeight.kg - prevWeight.kg : null;

  // 倒计时
  const windowState = useMemo(
    () => getMealWindowState(schedules, now),
    [schedules, now]
  );
  const countdownTarget = windowState.current
    ? windowState.current.windowEnd
    : windowState.next.windowStart;
  const countdownMs = countdownTarget.getTime() - now.getTime();
  const countdownText = fmtCountdown(countdownMs);

  // 倒计时卡片标题 + CTA 状态
  const ctaSlot: MealSlot = windowState.current
    ? windowState.current.slot
    : windowState.next.slot;
  const ctaIsTomorrow = !windowState.current && windowState.next.slot === "breakfast"
    && windowState.next.windowStart.getDate() !== now.getDate();
  const cardTitle = windowState.current
    ? `${SLOT_LABEL[ctaSlot]}时间到啦!`
    : ctaIsTomorrow
    ? "明天早餐"
    : `距离${SLOT_LABEL[ctaSlot]}还有`;
  const alreadyDone = windowState.current
    ? todayMeals[ctaSlot] === "done"
    : false;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 1. 状态大标题 + Mascot */}
        <View className="flex-row items-start">
          <View className="flex-1 pr-3 pt-2">
            <Text
              className="font-semibold"
              style={{ fontSize: 36, color: colors.brand.greenDark, lineHeight: 44 }}
            >
              {title}
            </Text>
            <Text
              className="mt-2"
              style={{ fontSize: 16, color: colors.ink.sub, lineHeight: 22 }}
            >
              {subtitle}
            </Text>
            <Text
              style={{ fontSize: 16, color: colors.ink.sub, lineHeight: 22 }}
            >
              {hint}
            </Text>
          </View>
          <Mascot hp={hp} stage={2} size={110} />
        </View>

        {/* HP 心形条卡片 */}
        <View
          className="mt-5 px-5 py-4 rounded-2xl"
          style={{
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <Text className="text-sub text-xs mb-2">{robotName} 的体力</Text>
          <HpHearts hp={hp} />
        </View>

        {/* 2. 当前体重模块 */}
        <Pressable
          // typed routes 类型 cache 还没含新路由（Metro 启动后 regen）；用 as any 绕开 tsc
          onPress={() => router.push("/(main)/weight-entry" as never)}
          className="mt-4 px-5 py-4 rounded-2xl"
          style={{
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sub text-xs">当前体重</Text>
              {lastWeight ? (
                <>
                  <Text
                    className="font-semibold mt-1"
                    style={{ fontSize: 32, color: colors.ink.primary }}
                  >
                    {lastWeight.kg.toFixed(1)} kg
                  </Text>
                  <Text className="text-sub text-xs mt-1">
                    {prevWeight && weightDiff !== null
                      ? `对比上次 ${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(1)} kg · ${fmtWeightTime(lastWeight.recordedAt)}`
                      : `首次记录 · ${fmtWeightTime(lastWeight.recordedAt)}`}
                  </Text>
                </>
              ) : (
                <Text
                  className="mt-1"
                  style={{ fontSize: 18, color: colors.ink.sub }}
                >
                  还没有记录哦
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 28 }}>⚖️</Text>
          </View>
        </Pressable>

        {/* 3. 下一餐倒计时 */}
        <View
          className="mt-4 px-5 py-5 rounded-2xl"
          style={{
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <Text style={{ fontSize: 18, color: colors.ink.primary }}>
            {cardTitle}
          </Text>
          <Text
            className="font-semibold mt-2"
            style={{ fontSize: 44, color: colors.brand.greenDark, lineHeight: 52 }}
          >
            {countdownText}
          </Text>
          <Pressable
            onPress={() => {
              if (alreadyDone) return;
              router.push({
                pathname: "/(main)/photo",
                params: { slot: ctaSlot },
              } as never);
            }}
            className="mt-4 py-4 items-center rounded-2xl"
            style={{
              backgroundColor: alreadyDone
                ? colors.bg.hpEmpty
                : colors.brand.green,
              opacity: alreadyDone ? 0.6 : 1,
            }}
            disabled={alreadyDone}
          >
            <Text
              className="font-semibold"
              style={{
                fontSize: 18,
                color: alreadyDone ? colors.ink.sub : "#FFFFFF",
              }}
            >
              {alreadyDone ? "已记录 ✓" : "去拍照"}
            </Text>
          </Pressable>
          <Text
            className="text-center mt-3"
            style={{ fontSize: 12, color: colors.ink.muted }}
          >
            超过时间将无法获得额外奖励哦~
          </Text>
        </View>

        {/* 4. 今日记录 */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text
            className="font-semibold"
            style={{ fontSize: 20, color: colors.ink.primary }}
          >
            今日记录
          </Text>
          <Pressable onPress={() => router.push("/(main)/records" as never)}>
            <Text className="text-sub text-sm">查看更多 ›</Text>
          </Pressable>
        </View>

        {/*
          TODO §11.K 第 7 项：dialogueHistory 当前是 string[]（仅 ID），
          没有 timestamp / hpDelta / 缩略图字段。等第 7 项重塑 shape 时
          把数据接到这里。当前展示空态。
        */}
        <View
          className="mt-3 px-5 py-8 rounded-2xl items-center"
          style={{
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <Text style={{ fontSize: 28 }}>🍙</Text>
          <Text className="text-sub text-sm mt-3 text-center">
            今天还没有记录，等等就要吃饭啦！
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
