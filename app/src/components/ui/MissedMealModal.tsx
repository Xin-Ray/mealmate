import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@src/components/ui/Card";
import PrimaryButton from "@src/components/ui/PrimaryButton";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// 错过餐次提示 modal(/(modal)/meal-missed 路由)
//
// v1.2.5 build 13 重写:
//   - 移除 mascot 图(193x173 missed.png)
//   - 移除「血量 -10」badge
//   - 文案改纯鼓励调
//   - 整体退到「日记式」温和卡,无 modal「警告」气质
//
// 注意:该路由现已是次入口(_layout 不主动推 modal,主要交互走首页
// <MealIncompleteCard>),保留只为兼容老 deep link / 直接 router.push。

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
          <Text
            className="font-semibold"
            style={{ fontSize: 22, color: colors.brand.greenDark }}
          >
            {SLOT_LABEL[slot]}这餐没拍上
          </Text>
          <Text
            className="text-center mt-3"
            style={{ fontSize: 15, color: colors.ink.sub, lineHeight: 22 }}
          >
            没关系,下一顿等你 🌱{"\n"}保持你的节奏就好。
          </Text>
          <View className="w-full mt-6">
            <PrimaryButton label="知道了" onPress={onAcknowledge} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
