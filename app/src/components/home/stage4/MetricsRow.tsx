import { selectStandardWeight } from "@src/store/selectors/standardWeight";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { Text, View } from "react-native";

// 3 列指标：当前体重 / 目标体重(或 standardWeight) / 已运动 X/Y 次
// Figma 59:297 row 2 参考
//
// TODO（doc §十二 risk 2）：已运动数据源没有（fullnessHistory 没运动字段）。
// 这里占位写死 "1/2"，等 xin 决定是否引入运动记录字段

const Cell = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1, alignItems: "center" }}>
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.brand.green,
        marginBottom: 4,
      }}
    />
    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink.primary }}>
      {value}
    </Text>
    <Text style={{ fontSize: 11, color: colors.ink.sub, marginTop: 2 }}>
      {label}
    </Text>
  </View>
);

export default function MetricsRow() {
  const height = useStore((s) => s.height);
  const ethnicity = useStore((s) => s.ethnicity);
  const targetWeight = useStore((s) => s.targetWeight);
  const weightHistory = useStore((s) => s.weightHistory);

  const standardWeight = selectStandardWeight({ height, ethnicity });
  const target = targetWeight ?? standardWeight ?? null;
  const lastKg = weightHistory[weightHistory.length - 1]?.kg ?? null;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderColor: colors.border.card,
        borderWidth: 1,
        marginTop: 12,
      }}
    >
      <Cell
        label="当前体重"
        value={lastKg != null ? `${lastKg.toFixed(1)}kg` : "—"}
      />
      <View style={{ width: 1, backgroundColor: colors.border.card }} />
      <Cell
        label="目标体重"
        value={target != null ? `${target.toFixed(1)}kg` : "—"}
      />
      <View style={{ width: 1, backgroundColor: colors.border.card }} />
      {/* TODO doc §十二 risk: 运动记录没数据源，占位 1/2 */}
      <Cell label="已运动" value="1/2 次" />
    </View>
  );
}
