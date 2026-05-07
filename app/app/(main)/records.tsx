import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 记录页占位（v0.4 §11.D）
// TODO 实施第 5 项：饱腹度 3 选 1 + 记录 feed 合流（mealHistory + dialogueHistory + fullnessRecord）

export default function RecordsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-ink text-2xl font-semibold mb-2">记录</Text>
        <Text className="text-sub text-sm leading-6">
          v0.4 即将实现：餐后饱腹度评分 + 时间倒序记录 feed。
        </Text>
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-6 mt-6">
          <Text className="text-sub text-sm">⏳ Coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
