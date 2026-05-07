import { View, Text } from "react-native";
import { hpHeartsFill, hpToDisplay } from "@src/theme/hp";

// 10 颗心横排，按 HP/100 等比填充。
// 简化：>= 0.5 显示满心 ❤️，否则空心 🤍（PRD §11.B 没强制半填）

type Props = { hp: number };

export default function HpHearts({ hp }: Props) {
  const fills = hpHeartsFill(hp);
  const display = hpToDisplay(hp);
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
        <Text className="text-ink text-base font-semibold">{display}/100</Text>
      </View>
    </View>
  );
}
