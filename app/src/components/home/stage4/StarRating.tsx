import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { Text, View } from "react-native";

// ★ 星级评分（Figma 59:297 row 3）
//
// TODO（doc §十二 risk 3）：算法没明。Figma 显示 ★★★★★ 4/5 + 40/100。
// 占位映射：score = HP（0-100）；stars = round(HP/20)（0-5 颗）
// xin 真定后改这里 + 注释更新

const FILLED = "★";
const EMPTY = "☆";

export default function StarRating() {
  const hp = useStore((s) => s.hp);
  const stars = Math.min(5, Math.max(0, Math.round(hp / 20)));
  const score = Math.round(hp);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderColor: colors.border.card,
        borderWidth: 1,
        marginTop: 12,
      }}
    >
      <Text style={{ fontSize: 22, color: "#E8C46B", letterSpacing: 2 }}>
        {Array.from({ length: 5 }, (_, i) => (i < stars ? FILLED : EMPTY)).join("")}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink.primary }}>
        {score}
      </Text>
      <Text style={{ fontSize: 13, color: colors.ink.sub, marginLeft: 2 }}>
        /100
      </Text>
    </View>
  );
}
