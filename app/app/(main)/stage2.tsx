import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Stage2Screen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-6xl mb-6">🎉</Text>
        <Text className="text-ink text-2xl font-semibold mb-3">阶段 2 · 量化</Text>
        <Text className="text-sub text-base text-center leading-6 mb-10">
          你已经把"按时吃饭"养成了习惯。{"\n"}
          下一阶段会引入热量 / 蛋白质粗略量化，{"\n"}
          这部分功能即将到来。
        </Text>
        <Pressable
          onPress={() => router.replace("/(main)/home")}
          className="rounded-2xl py-4 px-8 bg-accent"
        >
          <Text className="text-white font-semibold">回到首页</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
