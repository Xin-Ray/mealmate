// 加餐卡（issue #3 v0.5+；上限 2→3 在 2026-05-30）
//
// 永远显示在首页（不依赖时间窗 / missed 状态）。
// 一天上限 SNACK_DAILY_LIMIT 次（防作弊通关，常量在 useStore）。
//
// 三态：
//   0/N → "加餐 / 拍一张，HP +10"（primary, pressable）
//   k/N（k 已达成且 < N）→ "再加一次，HP +10"（primary, pressable）
//   N/N → disabled 灰版 "今日加餐已用完 / 明天再来"
//
// 文案按 PRD §八 安全伦理边界：温柔正向，不带"奖励/惩罚"等强烈词。

import { Pressable, Text, View } from "react-native";
import { useStore, SNACK_DAILY_LIMIT } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";

const dateOf = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type Props = {
  onPress: () => void;
};

export default function SnackCard({ onPress }: Props) {
  // 读 dialogueHistory + todayKey 算今日 snack 次数
  const dialogueHistory = useStore((s) => s.dialogueHistory);
  const todayKey = useStore((s) => s.todayKey);
  const snackCount = dialogueHistory.filter(
    (d) => d.kind === "snack_done" && dateOf(d.ts) === todayKey
  ).length;

  const isFull = snackCount >= SNACK_DAILY_LIMIT;
  const titleText = isFull ? "今日加餐已用完" : "加餐";
  const subText = isFull
    ? "明天再来"
    : snackCount === 0
    ? "拍一张，HP +10"
    : "再加一次，HP +10";

  // 角标 "今日 N/2"
  const badgeText = `今日 ${snackCount}/${SNACK_DAILY_LIMIT}`;

  // 颜色变化：full 时灰；否则品牌色
  const titleColor = isFull ? colors.ink.muted : colors.brand.greenDark;
  const iconBg = isFull ? "#EDEDE5" : "#F0F5E6";
  const cardBg = isFull ? "#F4F2E8" : "#FBFAF1";
  const cardBorder = isFull ? "#E0DDD3" : "#E2E8CF";
  const arrowColor = isFull ? colors.ink.muted : colors.brand.greenDark;
  const emoji = isFull ? "🍽️" : "🍎";

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          opacity: isFull ? 0.7 : 1,
        }}
      >
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: titleColor,
            }}
          >
            {titleText}
          </Text>
          <View
            style={{
              marginLeft: 8,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 999,
              backgroundColor: isFull ? "#E0DDD3" : "#E2E8CF",
            }}
          >
            <Text style={{ fontSize: 10, color: colors.ink.sub }}>
              {badgeText}
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: colors.ink.sub,
            marginTop: 2,
          }}
        >
          {subText}
        </Text>
      </View>
      {!isFull && (
        <Text style={{ fontSize: 24, color: arrowColor, marginLeft: 8 }}>
          →
        </Text>
      )}
    </View>
  );

  // full 状态：不响应点击（直接渲染 View 而不是 Pressable，最简）
  if (isFull) {
    return (
      <View
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderWidth: 1,
          borderRadius: 30,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#F2EDDB" : cardBg,
        borderColor: cardBorder,
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 16,
      })}
    >
      {content}
    </Pressable>
  );
}
