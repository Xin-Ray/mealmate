// 下一顿倒计时 + 今日三餐进度卡（v0.5 feature/next-meal-card）
//
// 显示在首页第二板块（HomeMealStatusSlot 的 default fallback），替代之前的 null。
// 当前没有 active reminder（不在窗内 / 已 done）且没有未 ack 的 missed → 显示此卡。
//
// 内容：
//   - 顶部小字"距离下一顿"
//   - 大字：(明天)？slot 中文名 + "还有 HH:MM:SS"
//   - 3 颗星（早 / 午 / 晚）按当日 status 切：done ⭐ / missed ⭐ dim / pending ☆
//   - 星下小字 早 / 午 / 晚
//
// 倒计时每秒 tick（setInterval 1000ms + cleanup）。
//
// 没有按钮 —— 这是状态展示卡，不是行动卡。

import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useStore } from "@src/store/useStore";
import {
  formatCountdown,
  selectNextMealCountdown,
  selectTodayMealStars,
  type MealStar,
} from "@src/store/selectors/mealStars";
import { colors, spacing } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const SLOT_SHORT: Record<MealSlot, string> = {
  breakfast: "早",
  lunch: "午",
  dinner: "晚",
};

function Star({ state }: { state: MealStar }) {
  // 用 emoji 占位：
  //   done → ⭐（实心金）opacity 1
  //   missed → ⭐ opacity 0.3（看着像灰星，避免负面强烈 ❌ 💔）
  //   pending → ☆（空心）opacity 0.6
  const glyph = state === "pending" ? "☆" : "⭐";
  const opacity = state === "done" ? 1 : state === "missed" ? 0.3 : 0.6;
  const color = state === "pending" ? colors.ink.muted : undefined; // ☆ 用 muted 灰
  return (
    <Text style={{ fontSize: 28, opacity, color, textAlign: "center" }}>
      {glyph}
    </Text>
  );
}

export default function NextMealCard() {
  const mealSchedules = useStore((s) => s.mealSchedules);
  const todayMeals = useStore((s) => s.todayMeals);

  // 每秒 tick：触发 re-render 重新计算 secondsRemaining
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const stars = selectTodayMealStars({ todayMeals });
  const countdown = selectNextMealCountdown({ mealSchedules });

  const slotLabel = SLOT_LABEL[countdown.slot];
  const prefix = countdown.isNextDay ? "明天" : "";
  const timeStr = formatCountdown(countdown.secondsRemaining);

  return (
    <View
      style={{
        backgroundColor: "#FBFAF1", // 米色（同 MealReminderCard 配色）
        borderColor: "#E2E8CF",     // 浅绿边（同 ReminderCard）
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: colors.ink.sub,
          marginBottom: 4,
        }}
      >
        距离下一顿
      </Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color: colors.brand.greenDark,
          lineHeight: 28,
        }}
      >
        {prefix}
        {slotLabel} 还有
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 36,
          fontWeight: "700",
          color: colors.brand.greenDark,
          fontVariant: ["tabular-nums"], // 数字等宽，倒计时不抖
          letterSpacing: 1,
        }}
      >
        {timeStr}
      </Text>

      {/* 3 颗星 + 标签 */}
      <View
        style={{
          marginTop: spacing.lg,
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Star state={stars.breakfast} />
          <Text style={{ fontSize: 12, color: colors.ink.sub, marginTop: 2 }}>
            {SLOT_SHORT.breakfast}
          </Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Star state={stars.lunch} />
          <Text style={{ fontSize: 12, color: colors.ink.sub, marginTop: 2 }}>
            {SLOT_SHORT.lunch}
          </Text>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Star state={stars.dinner} />
          <Text style={{ fontSize: 12, color: colors.ink.sub, marginTop: 2 }}>
            {SLOT_SHORT.dinner}
          </Text>
        </View>
      </View>
    </View>
  );
}
