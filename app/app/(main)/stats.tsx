import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 统计页占位（v0.4 §11.E）
// TODO 实施第 6 项：爱心趋势图 + 体重趋势图（纯 RN 散点 + 直线段，不装 chart 库）

export default function StatsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-ink text-2xl font-semibold mb-2">统计</Text>
        <Text className="text-sub text-sm leading-6">
          v0.4 即将实现：爱心变化趋势 + 体重变化趋势（按阶段分档）。
        </Text>
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-6 mt-6">
          <Text className="text-sub text-sm">⏳ Coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
