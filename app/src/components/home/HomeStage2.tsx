import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import Card from "@src/components/ui/Card";
import HpHearts from "@src/components/ui/HpHearts";
import StatusTitle from "@src/components/ui/StatusTitle";
import WeightCard from "@src/components/ui/WeightCard";
import MealCountdownCard from "@src/components/ui/MealCountdownCard";
import RecordCard from "@src/components/ui/RecordCard";
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
      pathname: "/(main)/photo",
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
          onPress={() => router.push("/(main)/weight-entry" as never)}
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

        {/*
          TODO §11.K 第 7 项：dialogueHistory shape 升级（加 ts / hpDelta /
          photoUri）后，把当天数据 map 成 RecordCard。当前空态。
        */}
        <View
          className="mt-3 px-5 py-8 rounded-2xl items-center"
          style={{
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <Text style={{ fontSize: 28 }}>🍙</Text>
          <Text className="text-sub text-sm mt-3 text-center">
            今天还没有记录，等等就要吃饭啦！
          </Text>
          {/* 数据接好后会替换为类似下面的 RecordCard 列表：
              <RecordCard ts={...} text="..." hpDelta={5} photoUri={...} />
          */}
          {false && <RecordCard text="" />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
