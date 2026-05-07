import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import HpBar from "@src/components/HpBar";
import Mascot from "@src/components/Mascot";
import MealCard from "@src/components/MealCard";
import WeekStrip from "@src/components/WeekStrip";
import {
  hpBandFromValue,
  pickDialogue,
} from "@src/data/dialogues";
import { generateMascotLine } from "@src/services/mascotLlm";
import type { MealSlot } from "@src/types";

// Stage 1 主页 — v0.3 视觉骨架，待 §11.K 第 4 项 token 化重做。
export default function HomeStage1() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const robotName = useStore((s) => s.robotName);
  const todayMeals = useStore((s) => s.todayMeals);
  const todayKey = useStore((s) => s.todayKey);
  const mealHistory = useStore((s) => s.mealHistory);
  const schedules = useStore((s) => s.mealSchedules);
  const currentStage = useStore((s) => s.currentStage);
  const companionLv = useStore((s) => s.companionLv);
  const dialogueHistory = useStore((s) => s.dialogueHistory);
  const canShowDisappearWarning = useStore((s) => s.canShowDisappearWarning);
  const setDisappearWarningShown = useStore((s) => s.setDisappearWarningShown);

  const band = hpBandFromValue(hp);
  const fallbackGreeting = useMemo(() => {
    return pickDialogue(band, "lunch", dialogueHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hp]);

  const [llmLine, setLlmLine] = useState<string | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    generateMascotLine(
      { stage: currentStage, hp, band, robotName },
      ctrl.signal
    ).then((line) => {
      if (line) setLlmLine(line);
    });
    return () => ctrl.abort();
  }, [hp, band, currentStage, robotName]);

  const greetingText =
    llmLine ?? fallbackGreeting?.text ?? "今天也一起吃饭吧～";

  const showDisappearAlert = band === "weak" && canShowDisappearWarning();

  useEffect(() => {
    if (showDisappearAlert) {
      setDisappearWarningShown();
    }
  }, [showDisappearAlert, setDisappearWarningShown]);

  const onMealPress = (slot: MealSlot) => {
    if (todayMeals[slot] === "done") {
      Alert.alert("已经吃过这顿啦", "今天先休息，看看其他餐次～");
      return;
    }
    router.push({ pathname: "/(main)/photo", params: { slot } });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-sub text-xs">阶段 {currentStage} · Lv{companionLv} · 坚持</Text>
            <Text className="text-ink text-xl font-semibold mt-1">{robotName}</Text>
          </View>
        </View>

        <View className="mt-5">
          <WeekStrip
            todayKey={todayKey}
            todayMeals={todayMeals}
            history={mealHistory}
          />
        </View>

        <View className="items-center mt-6 mb-4">
          <Mascot hp={hp} stage={currentStage} size={160} />
        </View>

        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4">
          <Text className="text-ink text-base leading-6">
            {greetingText}
          </Text>
          {showDisappearAlert && (
            <Text className="text-bad text-xs mt-2">
              （我现在有点没力气，能不能陪我吃一口？）
            </Text>
          )}
        </View>

        <View className="mt-4">
          <HpBar hp={hp} />
        </View>

        <Text className="text-ink text-base font-semibold mt-8 mb-3">今日三餐</Text>
        <MealCard
          slot="breakfast"
          scheduledAt={schedules.breakfast}
          status={todayMeals.breakfast}
          onPress={() => onMealPress("breakfast")}
        />
        <MealCard
          slot="lunch"
          scheduledAt={schedules.lunch}
          status={todayMeals.lunch}
          onPress={() => onMealPress("lunch")}
        />
        <MealCard
          slot="dinner"
          scheduledAt={schedules.dinner}
          status={todayMeals.dinner}
          onPress={() => onMealPress("dinner")}
        />

        <Text className="text-sub text-xs mt-2">
          tip：mock 版本——拍照只走一遍流程，不会真的上传服务器。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
