import { useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, Image, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore, HP_MEAL_PHOTO_GAIN } from "@src/store/useStore";
import FullnessRatingPicker from "@src/components/ui/FullnessRatingPicker";
import { pickImageWithFallback, type Source } from "@src/services/imagePicker";
import type { FullnessScore, MealSlot } from "@src/types";

type Phase = "intro" | "preview" | "uploading" | "result";

const slotLabel: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

// PRD §11.F.1：通过餐推送 2 条 dialogue（"太棒了！X 看起来不错" + 鼓励话）
const DONE_LINE_BY_SLOT: Record<MealSlot, string[]> = {
  breakfast: [
    "太棒了！早餐看起来不错",
    "今天的第一顿，开始得很好",
    "早餐光盘 ✓ 你今天的状态我看好",
  ],
  lunch: [
    "太棒了！午餐看起来不错",
    "中午这顿很到位",
    "午餐打卡，节奏稳",
  ],
  dinner: [
    "太棒了！晚餐看起来不错",
    "晚餐吃完，今天就圆满啦",
    "一天三顿都齐了，开心",
  ],
};

const ENCOURAGE_LINES = [
  "继续加油哈，这么下去一定可以尽快达到目标的",
  "保持节奏就很好，慢慢来",
  "你今天的努力我都看见了",
  "陪着你吃饭真开心",
  "这一份认真我先收下了",
];

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export default function PhotoScreen() {
  const { slot } = useLocalSearchParams<{ slot: MealSlot }>();
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";
  const router = useRouter();
  const markMealDone = useStore((s) => s.markMealDone);
  const robotName = useStore((s) => s.robotName);
  const pushDialogue = useStore((s) => s.pushDialogue);
  const addFullnessRecord = useStore((s) => s.addFullnessRecord);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const todayKey = useStore((s) => s.todayKey);

  const [phase, setPhase] = useState<Phase>("intro");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<Source>("camera");
  const [doneLine, setDoneLine] = useState<string>("");
  const [encourageLine, setEncourageLine] = useState<string>("");
  const [selectedFullness, setSelectedFullness] = useState<FullnessScore | undefined>(
    () =>
      fullnessHistory.find((r) => r.date === todayKey && r.mealSlot === realSlot)
        ?.score
  );

  // HP +5 弹一下的 scale animation
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === "result") {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 220, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [phase, scale]);

  const pickImage = async (source: Source) => {
    setLastSource(source);
    const picked = await pickImageWithFallback(source);
    if (picked) {
      setImageUri(picked.uri);
      setPhase("preview");
    }
  };

  // preview → 用户点"确定" → 进 uploading → 模拟上传 → result
  // §11.F.1：通过餐 +5 HP，push 两条 dialogue（done line + encourage line）
  const onConfirm = () => {
    setPhase("uploading");
    setTimeout(() => {
      markMealDone(realSlot, { photoUri: imageUri ?? undefined });

      const doneBody = pickRandom(DONE_LINE_BY_SLOT[realSlot]);
      const encourageBody = pickRandom(ENCOURAGE_LINES);

      pushDialogue({
        kind: "meal_done",
        body: doneBody,
        mealSlot: realSlot,
        hpDelta: HP_MEAL_PHOTO_GAIN,
        photoUri: imageUri ?? undefined,
      });
      pushDialogue({
        kind: "encourage",
        body: encourageBody,
        mealSlot: realSlot,
      });
      setDoneLine(doneBody);
      setEncourageLine(encourageBody);
      setPhase("result");
    }, 900);
  };

  const onSelectFullness = (score: FullnessScore) => {
    setSelectedFullness(score);
    addFullnessRecord({ mealSlot: realSlot, score });
  };

  const onFinish = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-ink text-lg font-semibold">{slotLabel[realSlot]} · 记录</Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sub text-sm">关闭</Text>
          </Pressable>
        </View>

        {phase === "intro" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            <Text className="text-ink text-base text-center mb-6">
              拍一张你正在吃的或准备吃的就行，{"\n"}哪怕只是一杯牛奶。
            </Text>
            <Pressable
              onPress={() => pickImage("camera")}
              className="rounded-2xl py-4 px-8 bg-accent mb-3 w-full items-center"
            >
              <Text className="text-white font-semibold">拍一张</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage("library")}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder w-full items-center"
            >
              <Text className="text-ink font-semibold">从相册选</Text>
            </Pressable>
          </View>
        )}

        {phase === "preview" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 280, height: 280, borderRadius: 24 }}
                resizeMode="cover"
              />
            )}
            <Text className="text-sub text-sm mt-4 mb-6">看起来怎么样？</Text>
            <Pressable
              onPress={onConfirm}
              className="rounded-2xl py-4 px-8 bg-accent mb-3 w-full items-center"
            >
              <Text className="text-white font-semibold">确定</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage(lastSource)}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder w-full items-center"
            >
              <Text className="text-ink font-semibold">
                {lastSource === "camera" ? "重拍" : "重选"}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "uploading" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 220, height: 220, borderRadius: 24 }}
                resizeMode="cover"
              />
            )}
            <Text className="text-sub text-sm mt-6">上传中...</Text>
          </View>
        )}

        {phase === "result" && (
          <View className="items-center" style={{ paddingTop: 16 }}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <View className="bg-ok/20 rounded-full px-6 py-3 mb-4">
                <Text className="text-ok text-base font-semibold">
                  血量 +{HP_MEAL_PHOTO_GAIN}
                </Text>
              </View>
            </Animated.View>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 160, height: 160, borderRadius: 20, opacity: 0.9 }}
                resizeMode="cover"
              />
            )}
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-5 w-full">
              <Text className="text-sub text-xs mb-2">{robotName}</Text>
              <Text className="text-ink text-base leading-6">{doneLine}</Text>
              {encourageLine && (
                <Text className="text-ink text-sm leading-5 mt-2 opacity-80">
                  {encourageLine}
                </Text>
              )}
            </View>

            <Text className="text-ink text-sm font-semibold mt-6 self-start">
              这餐吃得怎么样？
            </Text>
            <View className="w-full mt-2">
              <FullnessRatingPicker
                selectedScore={selectedFullness}
                onSelect={onSelectFullness}
              />
            </View>

            <Pressable
              onPress={onFinish}
              className="rounded-2xl py-4 px-8 bg-accent mt-6 w-full items-center"
            >
              <Text className="text-white font-semibold">
                {selectedFullness === undefined ? "跳过，先回首页" : "完成"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
