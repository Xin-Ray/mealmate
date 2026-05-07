import { View, Text } from "react-native";
import { hpHeartsFill } from "@src/theme/hp";

// 10 颗心横排，按 HP/100 等比填充（store v2 起 HP 即为 0–100，无需缩放）。
// 简化：>= 0.5 显示满心 ❤️，否则空心 🤍。

type Props = { hp: number };

export default function HpHearts({ hp }: Props) {
  const fills = hpHeartsFill(hp);
  const clamped = Math.max(0, Math.min(100, hp));
  return (
    <View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-0.5">
          {fills.map((f, i) => (
            <Text key={i} style={{ fontSize: 22 }}>
              {f >= 0.5 ? "❤️" : "🤍"}
            </Text>
          ))}
        </View>
        <Text className="text-ink text-base font-semibold">
          {clamped}/100
        </Text>
      </View>
    </View>
  );
}
