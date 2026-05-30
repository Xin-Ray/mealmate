import { Text, View } from "react-native";
import { colors } from "@src/theme/tokens";

// r1 F4+F6：每个 stage home 顶部统一显示 "阶段N · <name>" 暖橘 chip
// xin spec：5 个 stage 全有，stage 3 去掉 "v1"

const NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "坚持",
  2: "量化",
  3: "健康增重",
  4: "营养",
  5: "持之以恒",
};

type Props = { stage: 1 | 2 | 3 | 4 | 5 };

export default function StageChip({ stage }: Props) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: "#FFEFD8",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: colors.brand.accentDark,
          fontWeight: "600",
        }}
      >
        阶段{stage} · {NAMES[stage]}
      </Text>
    </View>
  );
}
