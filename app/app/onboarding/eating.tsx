import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";

type Choice = "normal" | "want_more" | "irregular";

const choices: { id: Choice; label: string; sub: string }[] = [
  { id: "normal",     label: "正常",       sub: "三顿都基本能吃" },
  { id: "want_more",  label: "想多吃点",   sub: "在意增重 / 营养" },
  { id: "irregular",  label: "不太规律",   sub: "经常跳过或没胃口" },
];

export default function EatingScreen() {
  const router = useRouter();
  const setGentleMode = useStore((s) => s.setGentleMode);
  const [picked, setPicked] = useState<Choice | null>(null);

  const next = () => {
    if (!picked) return;
    setGentleMode(picked === "irregular");
    router.push("/onboarding/schedule");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sub text-sm">第 1 / 4 步</Text>
        <Text className="text-ink text-2xl font-semibold mt-2">最近吃饭怎么样？</Text>
        <Text className="text-sub text-sm mt-2">
          这会决定我用什么节奏陪你。选哪个都可以，之后也能在设置里改。
        </Text>

        <View className="mt-8">
          {choices.map((c) => {
            const active = picked === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setPicked(c.id)}
                className={`border rounded-2xl px-5 py-4 mb-3 ${
                  active ? "border-accent bg-accent/10" : "border-cardBorder bg-white"
                }`}
              >
                <Text className="text-ink text-base font-medium">{c.label}</Text>
                <Text className="text-sub text-xs mt-1">{c.sub}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={next}
          disabled={!picked}
          className={`rounded-2xl py-4 items-center mb-6 ${
            picked ? "bg-accent" : "bg-hpEmpty"
          }`}
        >
          <Text className={`text-base font-semibold ${picked ? "text-white" : "text-sub"}`}>
            下一步
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
