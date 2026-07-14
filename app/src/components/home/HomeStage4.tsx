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
import MealStatusDots from "@src/components/home/stage4/MealStatusDots";
import MetricsRow from "@src/components/home/stage4/MetricsRow";
import StarRating from "@src/components/home/stage4/StarRating";
import WeeklyFoodProgress from "@src/components/home/stage4/WeeklyFoodProgress";
import WeightGoalProgressCard from "@src/components/home/stage4/WeightGoalProgressCard";
import SnackCard from "@src/components/ui/SnackCard";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Stage 4 主页（v1.1，Figma 59:297）：营养
// 新 layout，跟 stage 2 视觉差别大。模块：
// 1. Hero with circular weight progress + mascot
// 2. 3 列指标行（当前 / 目标 / 已运动）
// 3. ★ 星级评分
// 4. 提醒卡（沿用）
// 5. 本周饮食进度（主食 / 蔬菜，TODO 数据源）
// 6. 早午晚 status 圆
// 7. SnackCard
// 8. 今日记录
//
// ProfileSetupBanner（commit #12c）：height==null 时顶部弹引导填体质数据

export default function HomeStage4() {
  const router = useRouter();
  const height = useStore((s) => s.height);
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
        <StageChip stage={4} />
        <StageRulesCard stage={4} />
        {/* r1 F5：周一到周日吃饭记录表 */}
        <WeekStripConnected />
        <View style={{ height: 16 }} />
        {/* 老用户引导 banner（doc §十三 入口 2，简化版）*/}
        {height === null && (
          <Pressable
            onPress={() => router.push("/(main)/settings" as never)}
            style={{
              backgroundColor: "#FFF8E6",
              borderColor: "#F3D89C",
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>ⓘ</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.brand.accentDark,
                  fontWeight: "500",
                }}
              >
                还差一步设置你的健康数据
              </Text>
              <Text
                style={{ fontSize: 12, color: colors.ink.sub, marginTop: 2 }}
              >
                设置身高 + 族裔后，我才能帮你算合适的体重目标
              </Text>
            </View>
            <Text style={{ color: colors.brand.accentDark, fontSize: 16 }}>
              →
            </Text>
          </Pressable>
        )}

        {/* 1. Hero with circular progress */}
        <WeightGoalProgressCard
          title="你可以的"
          subtitle="通过饮食与运动，稳定接近目标体重"
          showProgress
        />

        {/* 2. 3 列指标行 */}
        <MetricsRow />

        {/* 3. 星级评分 */}
        <StarRating />

        {/* 4. 提醒卡 */}
        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        {/* 5. 本周饮食进度（TODO 数据源） */}
        <WeeklyFoodProgress />

        {/* 6. 早午晚 status 圆 */}
        <MealStatusDots />

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
        {/* r1 F7: ExerciseCard 占位 OPEN-R1-C */}
        <ExerciseCard />

        {/* 7. 加餐卡 */}
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

        {/* 8. 今日记录 */}
        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
