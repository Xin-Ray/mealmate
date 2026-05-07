import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@src/components/ui/Card";
import PrimaryButton from "@src/components/ui/PrimaryButton";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// 错过餐次提示 modal（占位 UI，按 Figma 1:79 missed-meal 块）
// HP 扣分 / 调度逻辑留 §11.K 第 7 项

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

type Props = {
  slot: MealSlot;
  onAcknowledge: () => void;
};

export default function MissedMealModal({ slot, onAcknowledge }: Props) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <View className="flex-1 px-6 justify-center">
        <Card style={{ paddingVertical: 28, alignItems: "center" }}>
          <Image
            source={require("../../../assets/mascot/missed.png")}
            style={{ width: 193, height: 173 }}
            resizeMode="contain"
          />
          <Text
            className="font-semibold mt-4"
            style={{ fontSize: 22, color: colors.brand.greenDark }}
          >
            你错过了一餐
          </Text>
          <View
            className="px-3 py-1 rounded-full mt-2"
            style={{ backgroundColor: `${colors.status.bad}22` }}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 13, color: colors.status.bad }}
            >
              血量 -10
            </Text>
          </View>
          <Text
            className="text-center mt-3"
            style={{ fontSize: 14, color: colors.ink.sub, lineHeight: 22 }}
          >
            {SLOT_LABEL[slot]}没吃，有点饿。{"\n"}希望下一顿可以吃上饭。
          </Text>
          <View className="w-full mt-6">
            <PrimaryButton label="我知道了" onPress={onAcknowledge} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
