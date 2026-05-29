import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore, type Gender, type Ethnicity } from "@src/store/useStore";

// v1.1 OPEN-1 → A：onboarding 加一步收 height/gender/ethnicity
// doc §十三。视觉沿用 eating.tsx 卡片样式。

const GENDERS: { id: Gender; label: string; sub: string }[] = [
  { id: "female", label: "女", sub: "" },
  { id: "male", label: "男", sub: "" },
  { id: "other", label: "其它", sub: "或不愿透露" },
];

const ETHNICITIES: { id: Ethnicity; label: string; sub: string }[] = [
  { id: "asian", label: "亚裔", sub: "BMI 健康值用 21" },
  { id: "other", label: "其它", sub: "BMI 健康值用 22" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const setHeight = useStore((s) => s.setHeight);
  const setGender = useStore((s) => s.setGender);
  const setEthnicity = useStore((s) => s.setEthnicity);

  const [h, setH] = useState("");
  const [g, setG] = useState<Gender | null>(null);
  const [e, setE] = useState<Ethnicity | null>(null);

  const heightNum = parseInt(h, 10);
  const heightValid =
    !isNaN(heightNum) && heightNum >= 80 && heightNum <= 250;
  const canNext = heightValid && g != null && e != null;

  const next = () => {
    if (!canNext) return;
    setHeight(heightNum);
    setGender(g);
    setEthnicity(e);
    router.push("/onboarding/schedule");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sub text-sm">第 2 / 4 步</Text>
        <Text className="text-ink text-2xl font-semibold mt-2">
          再问几个小问题
        </Text>
        <Text className="text-sub text-sm mt-2">
          帮我算一个对你合适的健康体重。
        </Text>

        {/* 身高 */}
        <Text className="text-sub text-xs mt-6 ml-1">身高 (cm)</Text>
        <View
          className="border rounded-2xl px-5 py-4 mt-2 flex-row items-center bg-white"
          style={{ borderColor: heightValid || !h ? "#D7DBC3" : "#E8B466" }}
        >
          <TextInput
            className="flex-1 text-ink text-base"
            value={h}
            onChangeText={setH}
            keyboardType="numeric"
            placeholder="例如 165"
            maxLength={3}
          />
          <Text className="text-sub">cm</Text>
        </View>
        {h && !heightValid && (
          <Text className="text-xs mt-1 ml-2" style={{ color: "#C77B1F" }}>
            请输入 80-250 之间的数字
          </Text>
        )}

        {/* 性别 */}
        <Text className="text-sub text-xs mt-5 ml-1">性别</Text>
        <View className="flex-row gap-2 mt-2">
          {GENDERS.map((c) => {
            const active = g === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setG(c.id)}
                className={`flex-1 border rounded-2xl px-4 py-3 items-center ${
                  active ? "border-accent bg-accent/10" : "border-cardBorder bg-white"
                }`}
              >
                <Text className="text-ink text-base font-medium">{c.label}</Text>
                {c.sub ? (
                  <Text className="text-sub text-xs mt-1">{c.sub}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* 族裔 */}
        <Text className="text-sub text-xs mt-5 ml-1">族裔</Text>
        <View className="flex-row gap-2 mt-2">
          {ETHNICITIES.map((c) => {
            const active = e === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setE(c.id)}
                className={`flex-1 border rounded-2xl px-4 py-3 items-center ${
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
          disabled={!canNext}
          className={`rounded-2xl py-4 items-center mb-6 ${
            canNext ? "bg-accent" : "bg-hpEmpty"
          }`}
        >
          <Text
            className={`text-base font-medium ${
              canNext ? "text-white" : "text-sub"
            }`}
          >
            下一步
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
