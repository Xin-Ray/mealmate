import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";

// Stage 1 占位：不真接 ChatGPT OAuth。
// 用 ChatGPT 登录 → 标记 chatGPTLinked=false（我们还没接），跳 Home
// 暂时不用 → chatGPTLinked=false，跳 Home
// 真正的 OAuth 接入在 docs/auth-and-ai.md 中描述，会在后续 session 实现。

export default function ChatGPTScreen() {
  const router = useRouter();
  const setChatGPTLinked = useStore((s) => s.setChatGPTLinked);
  const finishOnboarding = useStore((s) => s.finishOnboarding);

  const proceed = () => {
    setChatGPTLinked(false); // mock — 真正 OAuth 后续接入
    finishOnboarding();
    router.replace("/(main)/home");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sub text-sm">第 4 / 4 步</Text>
        <Text className="text-ink text-2xl font-semibold mt-2">用 ChatGPT 登录？</Text>
        <Text className="text-sub text-sm mt-2 leading-5">
          登录后，机器人能用你自己的 ChatGPT 额度跟你聊天，不需要额外订阅。
          {"\n"}你也可以先体验，登录这步随时可以再做。
        </Text>

        <View className="border border-cardBorder bg-white rounded-2xl p-5 mt-6">
          <Text className="text-ink text-base font-medium">为什么用你的 ChatGPT？</Text>
          <Text className="text-sub text-sm mt-2 leading-5">
            · 复用你已有的 Plus 订阅，我们不另收费{"\n"}
            · 你能控制自己的对话历史和模型选择{"\n"}
            · 后端只做最小转发，不存对话内容
          </Text>
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={proceed}
          className="rounded-2xl py-4 items-center mb-3 bg-accent"
        >
          <Text className="text-base font-semibold text-white">用 ChatGPT 登录</Text>
        </Pressable>
        <Pressable onPress={proceed} className="py-3 items-center mb-6">
          <Text className="text-sub text-sm">暂时不用 AI · 体验受限版</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
