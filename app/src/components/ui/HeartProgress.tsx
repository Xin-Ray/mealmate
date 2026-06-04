// 4 颗爱心进度条 (Stage 0.5 hero 用) — v1.2.1
//
// stage05Score 0-40,每 10 分 = 1 颗爱心填亮
// 填亮 = 红心, 未填 = 描边灰心(都是 emoji 字符不需要资源)
//
// Props:
//   score (0-40) — 当前分数
//   total (默认 40) — 上限,通关阈值

import { Text, View } from "react-native";
import { colors } from "@src/theme/tokens";

type Props = {
  score: number;
  total?: number;
};

const HEART_FULL = "❤️";
const HEART_EMPTY = "🤍";

export default function HeartProgress({ score, total = 40 }: Props) {
  const filled = Math.floor(score / 10);
  const totalHearts = Math.floor(total / 10);

  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 30,
        backgroundColor: colors.bg.card,
        borderColor: colors.border.card,
        borderWidth: 1,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: colors.ink.sub,
          marginBottom: 12,
          letterSpacing: 0.5,
        }}
      >
        我们的目标
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {Array.from({ length: totalHearts }).map((_, i) => (
          <Text
            key={i}
            style={{
              fontSize: 36,
              opacity: i < filled ? 1 : 0.35,
            }}
          >
            {i < filled ? HEART_FULL : HEART_EMPTY}
          </Text>
        ))}
      </View>
      <Text
        style={{
          marginTop: 12,
          fontSize: 14,
          color: colors.ink.primary,
          fontWeight: "500",
        }}
      >
        {filled} / {totalHearts} 颗爱心
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontSize: 13,
          color: colors.ink.sub,
        }}
      >
        每一顿都算 · 慢慢来
      </Text>
    </View>
  );
}
