import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import Card from "@src/components/ui/Card";
import HpHearts from "@src/components/ui/HpHearts";
import StatusTitle from "@src/components/ui/StatusTitle";
import WeightCard from "@src/components/ui/WeightCard";
import MealCountdownCard from "@src/components/ui/MealCountdownCard";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// Stage 2 主页（v0.4 §11.B）：状态区 / HP 心形 / 体重 / 倒计时 / 今日记录
// 本屏纯组装，所有 UI 模块抽到 src/components/ui/。

export default function HomeStage2() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const robotName = useStore((s) => s.robotName);
  const todayMeals = useStore((s) => s.todayMeals);
  const schedules = useStore((s) => s.mealSchedules);
  const weightHistory = useStore((s) => s.weightHistory);

  const lastWeight = weightHistory[weightHistory.length - 1];
  const prevWeight =
    weightHistory.length >= 2 ? weightHistory[weightHistory.length - 2] : undefined;

  const onCaptureMeal = (slot: MealSlot) => {
    router.push({
      pathname: "/(modal)/photo",
      params: { slot },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 1. 状态大标题 + Mascot */}
        <StatusTitle hp={hp} />

        {/* HP 心形条 */}
        <Card style={{ marginTop: 20 }}>
          <Text className="text-sub text-xs mb-2">{robotName} 的体力</Text>
          <HpHearts hp={hp} />
        </Card>

        {/* 2. 当前体重 */}
        <WeightCard
          lastWeight={lastWeight}
          prevWeight={prevWeight}
          onPress={() => router.push("/(modal)/weight-entry" as never)}
        />

        {/* 3. 下一餐倒计时 */}
        <MealCountdownCard
          schedules={schedules}
          todayMeals={todayMeals}
          onCapture={onCaptureMeal}
        />

        {/* 4. 今日记录 */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text
            className="font-semibold"
            style={{ fontSize: 20, color: colors.ink.primary }}
          >
            今日记录
          </Text>
          <Pressable onPress={() => router.push("/(main)/records" as never)}>
            <Text className="text-sub text-sm">查看更多 ›</Text>
          </Pressable>
        </View>

        {/* 完整 feed 在记录页；首页只显示空态或最近 N 条预览（第 7 项接） */}
        <View className="mt-3">
          <EmptyRecord />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
