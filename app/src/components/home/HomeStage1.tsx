import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import Card from "@src/components/ui/Card";
import HpHearts from "@src/components/ui/HpHearts";
import StatusTitle from "@src/components/ui/StatusTitle";
import MealCountdownCard from "@src/components/ui/MealCountdownCard";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import WeekStrip from "@src/components/WeekStrip";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// Stage 1 主页（v0.4 §11.C）：与 Stage 2 共用 ui/ 组件库。
// 差异：① 状态文案用 stage 1 调性（getHpBand(hp, 1)），mascot 用 full.png 兜底
//       ② 不显示体重模块（stage 1 未解锁）
//       ③ 顶部多一行周视图（stage 1 特有）

export default function HomeStage1() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const robotName = useStore((s) => s.robotName);
  const todayMeals = useStore((s) => s.todayMeals);
  const todayKey = useStore((s) => s.todayKey);
  const mealHistory = useStore((s) => s.mealHistory);
  const schedules = useStore((s) => s.mealSchedules);

  const onCaptureMeal = (slot: MealSlot) => {
    router.push({
      pathname: "/(main)/photo",
      params: { slot },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 1. 周视图（stage 1 特有） */}
        <WeekStrip
          todayKey={todayKey}
          todayMeals={todayMeals}
          history={mealHistory}
        />

        {/* 2. 状态大标题 + Mascot（stage 1 调性） */}
        <View className="mt-5">
          <StatusTitle hp={hp} stage={1} />
        </View>

        {/* 3. HP 心形条 */}
        <Card style={{ marginTop: 20 }}>
          <Text className="text-sub text-xs mb-2">{robotName} 的体力</Text>
          <HpHearts hp={hp} />
        </Card>

        {/* 4. 下一餐倒计时 */}
        <MealCountdownCard
          schedules={schedules}
          todayMeals={todayMeals}
          onCapture={onCaptureMeal}
        />

        {/* 5. 今日记录区 */}
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
