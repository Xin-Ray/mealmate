import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import {
  hpBandFromValue,
  pickDialogue,
} from "@src/data/dialogues";
import { generateMascotLine } from "@src/services/mascotLlm";
import { pickImageWithFallback, type Source } from "@src/services/imagePicker";
import type { MealSlot } from "@src/types";

type Phase = "intro" | "preview" | "uploading" | "result";

const slotLabel: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export default function PhotoScreen() {
  const { slot } = useLocalSearchParams<{ slot: MealSlot }>();
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";
  const router = useRouter();
  const markMealDone = useStore((s) => s.markMealDone);
  const robotName = useStore((s) => s.robotName);
  const dialogueHistory = useStore((s) => s.dialogueHistory);
  const pushDialogue = useStore((s) => s.pushDialogue);

  const [phase, setPhase] = useState<Phase>("intro");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<Source>("camera");
  const [line, setLine] = useState<string>("");

  // HP +0.5 弹一下的 scale animation
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
  const onConfirm = () => {
    setPhase("uploading");
    setTimeout(async () => {
      markMealDone(realSlot);
      const afterHp = useStore.getState().hp;
      const stage = useStore.getState().currentStage;
      const band = hpBandFromValue(afterHp);

      // 先用 mock fallback 占位（保证 UI 不空），再异步去拉 LLM
      const picked = pickDialogue(band, realSlot, dialogueHistory);
      if (picked) {
        pushDialogue(picked.id);
        setLine(picked.text);
      } else {
        setLine("谢谢你陪我一起吃饭。");
      }
      setPhase("result");

      // LLM 升级：结合 stage × HP × meal_done 生成更生动的鼓励
      const llm = await generateMascotLine({
        stage,
        hp: afterHp,
        band,
        robotName: useStore.getState().robotName,
        slot: realSlot,
        recentAction: "meal_done",
      });
      if (llm) setLine(llm);
    }, 900);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-ink text-lg font-semibold">{slotLabel[realSlot]} · 记录</Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sub text-sm">关闭</Text>
          </Pressable>
        </View>

        {phase === "intro" && (
          <View className="flex-1 items-center justify-center">
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
          <View className="flex-1 items-center justify-center">
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
          <View className="flex-1 items-center justify-center">
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
          <View className="flex-1 items-center justify-center">
            <Animated.View style={{ transform: [{ scale }] }}>
              <View className="bg-ok/20 rounded-full px-6 py-3 mb-4">
                <Text className="text-ok text-base font-semibold">HP +0.5</Text>
              </View>
            </Animated.View>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 180, height: 180, borderRadius: 20, opacity: 0.85 }}
                resizeMode="cover"
              />
            )}
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-6 w-full">
              <Text className="text-sub text-xs mb-2">{robotName}</Text>
              <Text className="text-ink text-base leading-6">{line}</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="rounded-2xl py-4 px-8 bg-accent mt-8 w-full items-center"
            >
              <Text className="text-white font-semibold">完成</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
