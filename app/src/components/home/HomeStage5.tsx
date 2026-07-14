import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import StageChip from "@src/components/home/StageChip";
import StageRulesCard from "@src/components/home/StageRulesCard";
import WeekStripConnected from "@src/components/home/WeekStripConnected";
import ExerciseCard from "@src/components/ui/ExerciseCard";
import WeightCard from "@src/components/ui/WeightCard";
import TrendChart from "@src/components/ui/TrendChart";
import {
  autoYAxis,
  selectWeightTimeline,
} from "@src/store/selectors/stats";
// r1 F12+F13 删 MealStatusDots + WeeklyFoodProgress（stage 5 不需要）
import MetricsRow from "@src/components/home/stage4/MetricsRow";
import WeightGoalProgressCard from "@src/components/home/stage4/WeightGoalProgressCard";
import SnackCard from "@src/components/ui/SnackCard";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Stage 5 主页（v1.1，Figma 61:74）：持之以恒
// 几乎跟 stage 4 同骨架，差别：
// - hero "不朽印记 {stage5Stars}" + "让坚持变成一种习惯"（TODO OPEN-4 "50" 含义）
// - hero 不显示圆环进度（已在目标区间内）
// - 加 stars 显示
// - 60 天进度条（doc §二 stage 5 完成条件）

export default function HomeStage5() {
  const router = useRouter();
  const stage5Stars = useStore((s) => s.stage5Stars);
  const stage5StartedAt = useStore((s) => s.stage5StartedAt);

  const daysIn = stage5StartedAt
    ? Math.floor((Date.now() - stage5StartedAt) / (24 * 60 * 60 * 1000))
    : 0;
  const COMPLETE_DAYS = 60;
  const pct = Math.min(1, daysIn / COMPLETE_DAYS);

  // r1 F7：WeightCard / TrendChart 数据
  const weightHistory = useStore((s) => s.weightHistory);
  const lastWeight = weightHistory[weightHistory.length - 1];
  const prevWeight =
    weightHistory.length >= 2
      ? weightHistory[weightHistory.length - 2]
      : undefined;
  const weightData = selectWeightTimeline({ weightHistory });
  const weightYAxis = autoYAxis(weightData.map((p) => p.value));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 64 }}>
        {/* r1 F6：stage label chip */}
        <StageChip stage={5} />
        <StageRulesCard stage={5} />
        {/* r1 F5：周一到周日吃饭记录表 */}
        <WeekStripConnected />
        <View style={{ height: 16 }} />
        {/* Hero — TODO OPEN-4: "50" 占位用 stage5Stars，但 stage5Stars 在 demote
            时清零；如果 xin 想"不朽印记"是累计值，需要另一字段 cumulativeStars */}
        <WeightGoalProgressCard
          title={`不朽印记 ${stage5Stars || 50}`}
          subtitle="让坚持变成一种习惯"
          showProgress={false}
        />

        {/* 持之以恒进度（doc §二 stage 5 60 天完成） */}
        <View
          style={{
            marginTop: 12,
            backgroundColor: colors.bg.card,
            borderColor: colors.border.card,
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{ fontSize: 14, color: colors.ink.primary, fontWeight: "500" }}
            >
              坚持进度
            </Text>
            <Text style={{ fontSize: 14, color: colors.ink.sub }}>
              {daysIn}/{COMPLETE_DAYS} 天 · ★ {stage5Stars}
            </Text>
          </View>
          <View
            style={{
              height: 8,
              backgroundColor: colors.bg.hpEmpty,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${pct * 100}%`,
                backgroundColor: colors.brand.green,
              }}
            />
          </View>
        </View>

        {/* 指标 / 提醒 / 加餐 / 记录 — 沿用 stage 4 子组件
            r1 F12 删 <WeeklyFoodProgress />（stage 5 不需要本周饮食进度）
            r1 F13 删 <MealStatusDots />（stage 5 不需要早午晚 status）*/}
        <MetricsRow />

        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        {/* r1 F7: 体重卡 + 体重趋势 + 运动卡 */}
        <WeightCard
          lastWeight={lastWeight}
          prevWeight={prevWeight}
          onPress={() => router.push("/(modal)/weight-entry" as never)}
        />
        <View style={{ marginTop: 16 }}>
          <TrendChart
            title="体重变化"
            subtitle="kg"
            data={weightData}
            yAxis={weightYAxis}
            emptyText="还没有体重记录"
            height={140}
          />
        </View>
        <ExerciseCard />

        <View style={{ marginTop: 12 }}>
          <SnackCard
            onPress={() =>
              router.push({
                pathname: "/(modal)/photo",
                params: { snack: "true" },
              } as never)
            }
          />
        </View>

        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
