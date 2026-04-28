import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import Mascot from "@src/components/Mascot";

export default function NameScreen() {
  const router = useRouter();
  const robotName = useStore((s) => s.robotName);
  const setRobotName = useStore((s) => s.setRobotName);
  const [val, setVal] = useState(robotName);

  const next = () => {
    setRobotName(val);
    router.push("/onboarding/chatgpt");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sub text-sm">第 3 / 4 步</Text>
        <Text className="text-ink text-2xl font-semibold mt-2">给它取个名字</Text>
        <Text className="text-sub text-sm mt-2">
          以后它会用这个名字陪着你。
        </Text>

        <View className="items-center my-10">
          <Mascot hp={10} size={140} />
          <Text className="text-ink text-xl font-medium mt-4">
            Hi，我叫 {val.trim() || "小满"}
          </Text>
        </View>

        <View className="border border-cardBorder bg-white rounded-2xl px-5 py-4">
          <Text className="text-sub text-xs mb-2">名字</Text>
          <TextInput
            className="text-ink text-base"
            placeholder="小满"
            value={val}
            onChangeText={setVal}
            maxLength={12}
            autoCorrect={false}
          />
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={next}
          className="rounded-2xl py-4 items-center mb-6 bg-accent"
        >
          <Text className="text-base font-semibold text-white">下一步</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
