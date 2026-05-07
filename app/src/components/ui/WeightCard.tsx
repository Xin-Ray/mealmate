import { View, Text } from "react-native";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";
import type { WeightRecord } from "@src/types";

// 当前体重模块（HomeStage2 用）：最近一次 + 与上次 diff + 时间。
// 整卡可点 → onPress 跳 weight-entry modal。

type Props = {
  lastWeight?: WeightRecord;
  prevWeight?: WeightRecord;
  onPress: () => void;
};

const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mn}`;
};

export default function WeightCard({ lastWeight, prevWeight, onPress }: Props) {
  const weightDiff =
    lastWeight && prevWeight ? lastWeight.kg - prevWeight.kg : null;

  return (
    <Card onPress={onPress} style={{ marginTop: 16 }}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sub text-xs">当前体重</Text>
          {lastWeight ? (
            <>
              <Text
                className="font-semibold mt-1"
                style={{ fontSize: 32, color: colors.ink.primary }}
              >
                {lastWeight.kg.toFixed(1)} kg
              </Text>
              <Text className="text-sub text-xs mt-1">
                {prevWeight && weightDiff !== null
                  ? `对比上次 ${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(1)} kg · ${fmtTime(lastWeight.recordedAt)}`
                  : `首次记录 · ${fmtTime(lastWeight.recordedAt)}`}
              </Text>
            </>
          ) : (
            <Text
              className="mt-1"
              style={{ fontSize: 18, color: colors.ink.sub }}
            >
              还没有记录哦
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 28 }}>⚖️</Text>
      </View>
    </Card>
  );
}
