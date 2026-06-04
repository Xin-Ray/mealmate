import { Text, View } from "react-native";
import { colors } from "@src/theme/tokens";
import type { Stage } from "@src/store/useStore";

// r1 F4+F6：每个 stage home 顶部统一显示 "阶段N · <name>" 暖橘 chip
// v1.2.1: 加 stage 0 / 0.5 case(Stage 类型见 useStore)

type StageLabel = { label: string; name: string };

const STAGE_LABELS: Record<string, StageLabel> = {
  "0": { label: "阶段 0", name: "试一下" },
  "0.5": { label: "阶段 0.5", name: "起步" },
  "1": { label: "阶段 1", name: "坚持" },
  "2": { label: "阶段 2", name: "量化" },
  "3": { label: "阶段 3", name: "健康增重" },
  "4": { label: "阶段 4", name: "营养" },
  "5": { label: "阶段 5", name: "持之以恒" },
};

type Props = { stage: Stage };

export default function StageChip({ stage }: Props) {
  const info = STAGE_LABELS[String(stage)] ?? STAGE_LABELS["1"];
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
        {info.label} · {info.name}
      </Text>
    </View>
  );
}
