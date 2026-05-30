// 加餐卡（issue #3 v0.5+；上限 2→3 在 2026-05-30；样式跟 NextMealCard 对齐 r1 F10）
//
// 永远显示在首页（不依赖时间窗 / missed 状态）。
// 一天上限 SNACK_DAILY_LIMIT 次（防作弊通关，常量在 useStore）。
//
// 三态：
//   0/N → "拍一张，+10 HP"（primary, pressable）
//   k/N（k 已达成且 < N）→ "再加一次，+10 HP"（primary, pressable）
//   N/N → disabled 灰版 "今日加餐已用完 / 明天再来"
//
// r1 F10 样式重做：原版有左侧 emoji 圆头 + 右侧 → 像 chat 气泡。改成
// 跟 NextMealCard 同款"米色卡 + 顶部 label + 大字 + 副标"垂直 stack，
// 去掉头像/箭头，整卡 Pressable。
//
// 文案按 PRD §八 安全伦理边界：温柔正向，不带"奖励/惩罚"等强烈词。

import { Pressable, Text, View } from "react-native";
import { useStore, SNACK_DAILY_LIMIT } from "@src/store/useStore";
import { colors, spacing } from "@src/theme/tokens";

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
  const dialogueHistory = useStore((s) => s.dialogueHistory);
  const todayKey = useStore((s) => s.todayKey);
  const snackCount = dialogueHistory.filter(
    (d) => d.kind === "snack_done" && dateOf(d.ts) === todayKey
  ).length;

  const isFull = snackCount >= SNACK_DAILY_LIMIT;
  const titleText = isFull
    ? "今日加餐已用完"
    : snackCount === 0
    ? "拍一张，+10 HP"
    : "再加一次，+10 HP";
  const subText = isFull ? "明天再来" : "拍照记录加餐";
  const badgeText = `今日 ${snackCount}/${SNACK_DAILY_LIMIT}`;

  const titleColor = isFull ? colors.ink.muted : colors.brand.greenDark;
  const cardBg = isFull ? "#F4F2E8" : "#FBFAF1";
  const cardBorder = isFull ? "#E0DDD3" : "#E2E8CF";

  const Inner = (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: colors.ink.sub,
          }}
        >
          加餐
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
          fontSize: 22,
          fontWeight: "700",
          color: titleColor,
          lineHeight: 28,
        }}
      >
        {titleText}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: colors.ink.sub,
        }}
      >
        {subText}
      </Text>
    </>
  );

  // full 状态：不响应点击
  const cardStyle = {
    backgroundColor: cardBg,
    borderColor: cardBorder,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  } as const;

  if (isFull) {
    return <View style={cardStyle}>{Inner}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        ...cardStyle,
        backgroundColor: pressed ? "#F2EDDB" : cardBg,
      })}
    >
      {Inner}
    </Pressable>
  );
}
