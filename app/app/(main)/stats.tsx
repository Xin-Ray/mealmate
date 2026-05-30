import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatsChart from "@src/components/stats/StatsChart";
import { colors } from "@src/theme/tokens";

// v1.1 doc §七 Stats tab 改造：3 图表 (weight/stage/hp) × 3 子 tab (周/月/全部)
// 9 视图组合。Stage 阶梯线现版用直线连接，doc §十二 risk 9 留 TODO

type Window = "week" | "month" | "all";

const WINDOWS: { id: Window; label: string }[] = [
  { id: "week", label: "周" },
  { id: "month", label: "月" },
  { id: "all", label: "全部" },
];

export default function StatsScreen() {
  const [window, setWindow] = useState<Window>("week");

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

        {/* 子 tab 时间窗 */}
        <View
          className="flex-row mt-5"
          style={{
            backgroundColor: colors.bg.card,
            borderRadius: 12,
            padding: 4,
            borderColor: colors.border.card,
            borderWidth: 1,
          }}
        >
          {WINDOWS.map((w) => {
            const active = window === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => setWindow(w.id)}
                className="flex-1 py-2 rounded-lg items-center"
                style={{
                  backgroundColor: active ? colors.brand.green : "transparent",
                }}
              >
                <Text
                  style={{
                    color: active ? "#FFFFFF" : colors.ink.primary,
                    fontWeight: active ? "600" : "400",
                    fontSize: 14,
                  }}
                >
                  {w.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 3 个图表 */}
        <View style={{ marginTop: 20 }}>
          <StatsChart kind="weight" window={window} />
          <StatsChart kind="stage" window={window} />
          <StatsChart kind="hp" window={window} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
