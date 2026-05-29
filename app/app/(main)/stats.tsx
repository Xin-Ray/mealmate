import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import {
  selectHpTimeline,
  selectWeightTimeline,
  autoYAxis,
} from "@src/store/selectors/stats";
import TrendChart from "@src/components/ui/TrendChart";
import { colors } from "@src/theme/tokens";

// 统计页（PRD §11.E v0.4 hotfix#12 重写）：
// X 轴改成"记录时间"——按实际录入日期分布。
//
// v1.1 数据：
//   - 体重图：从 weightHistory
//   - 爱心图：从 hpHistory（v11 新加，addHp 时累积；v1.1 前历史无法补，
//     老用户 stats "全部"视图也从 v1.1 起算）
// 完整 3 图表 × 3 子 tab 改造（commit #13）见 doc §七

export default function StatsScreen() {
  const weightHistory = useStore((s) => s.weightHistory);
  const hpHistory = useStore((s) => s.hpHistory);

  const hpData = selectHpTimeline({ hpHistory });
  const weightData = selectWeightTimeline({ weightHistory });

  // 爱心图 Y 轴：固定 0-12（七档）
  const heartYAxis = [0, 2, 4, 6, 8, 10, 12];

  // 体重图 Y 轴：自动 min-max
  const weightYAxis = autoYAxis(weightData.map((p) => p.value));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 页头 */}
        <View className="mb-1">
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

        <View style={{ marginTop: 20 }}>
          {/* 爱心变化趋势 — v0.4 暂无 hpHistory，走空态 */}
          <TrendChart
            title="爱心变化趋势"
            subtitle="单位：颗爱心（1 颗爱心 = 10 点血量）"
            data={hpData}
            yAxis={heartYAxis}
            emptyText="爱心趋势记录功能开发中，敬请期待 v0.5"
          />

          {/* 体重变化趋势 */}
          <TrendChart
            title="体重变化趋势"
            subtitle="单位：kg"
            data={weightData}
            yAxis={weightYAxis}
            emptyText="还没有体重记录，去主页打卡吧~"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
