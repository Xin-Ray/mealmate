import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import {
  selectStageHpProgress,
  selectStageWeightProgress,
  autoYAxis,
} from "@src/store/selectors/stats";
import TrendChart, { type TrendPoint } from "@src/components/ui/TrendChart";
import { colors } from "@src/theme/tokens";

// 统计页（PRD §11.E）：爱心趋势 + 体重趋势
// v0.4 数据稀疏 — 仅 currentStage 有数据，其他 stage 显示空心圆 + 提示。
// 切换器 "近 5 个阶段" 留 v0.5。

export default function StatsScreen() {
  const hp = useStore((s) => s.hp);
  const currentStage = useStore((s) => s.currentStage);
  const weightHistory = useStore((s) => s.weightHistory);

  const hpProgress = selectStageHpProgress({ hp, currentStage });
  const weightProgress = selectStageWeightProgress({
    weightHistory,
    currentStage,
  });

  // 爱心图：Y 轴固定 0-12（0/2/4/6/8/10/12 七档；显示 12 让满血 10 颗心不贴顶）
  const heartPoints: TrendPoint[] = hpProgress.map((p) => ({
    stage: p.stage,
    value: p.hearts,
    bandLabel: p.label,
    display: p.hearts === null ? undefined : String(p.hearts),
  }));
  const heartYAxis = [0, 2, 4, 6, 8, 10, 12];

  // 体重图：Y 轴自动 min-max 缩放
  const weightPoints: TrendPoint[] = weightProgress.map((p) => ({
    stage: p.stage,
    value: p.avgKg,
    bandLabel: p.label,
    display: p.avgKg === null ? undefined : p.avgKg.toFixed(1),
  }));
  const weightYAxis = autoYAxis(weightPoints.map((p) => p.value));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 页头 */}
        <View className="flex-row items-start justify-between mb-1">
          <View className="flex-1 pr-3">
            <Text
              className="font-semibold"
              style={{ fontSize: 28, color: colors.ink.primary }}
            >
              📊 趋势图表
            </Text>
            <Text
              className="mt-1"
              style={{ fontSize: 14, color: colors.ink.sub, lineHeight: 20 }}
            >
              记录每一份努力，见证每一点进步
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full mt-1"
            style={{ backgroundColor: colors.bg.hpEmpty, opacity: 0.6 }}
          >
            <Text className="text-xs" style={{ color: colors.ink.sub }}>
              全部阶段
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          {/* 爱心变化趋势 */}
          <TrendChart
            title="爱心变化趋势"
            subtitle="单位：颗爱心（1 颗爱心 = 10 点血量）"
            switcherLabel="近 5 个阶段"
            dataPoints={heartPoints}
            yAxis={heartYAxis}
          />

          {/* 体重变化趋势 */}
          <TrendChart
            title="体重变化趋势"
            subtitle="单位：kg"
            switcherLabel="近 5 个阶段"
            dataPoints={weightPoints}
            yAxis={weightYAxis}
          />
        </View>

        <Text
          className="mt-2 text-center"
          style={{ fontSize: 11, color: colors.ink.muted }}
        >
          小贴士：跨阶段进度持久化将在 v0.5 落地，目前仅显示当前阶段。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
