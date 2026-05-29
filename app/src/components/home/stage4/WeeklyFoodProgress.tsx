import { colors } from "@src/theme/tokens";
import { Text, View } from "react-native";

// 本周饮食进度（Figma 59:297 row 5）：主食 1/2 + 蔬菜 1/2
//
// TODO（doc §十二 risk 2）：数据源没有 — fullnessHistory 不含食物种类，
// 需要先引入「食物标签」字段或接 YOLO 识别分类。占位 mock 静态值。
// xin 决定加食物标签后改这里 + 加 selector

const Bar = ({ label, done, total }: { label: string; done: number; total: number }) => {
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.card,
        borderColor: colors.border.card,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 14, color: colors.ink.primary, fontWeight: "500" }}>
          {label}
        </Text>
        <Text style={{ fontSize: 14, color: colors.ink.sub }}>
          {done}/{total}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: colors.bg.hpEmpty,
          borderRadius: 3,
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
  );
};

export default function WeeklyFoodProgress() {
  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          fontSize: 13,
          color: colors.ink.sub,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        本周饮食进度
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {/* TODO 静态占位，等 xin 决定食物标签机制 */}
        <Bar label="主食" done={1} total={2} />
        <Bar label="蔬菜" done={1} total={2} />
      </View>
    </View>
  );
}
