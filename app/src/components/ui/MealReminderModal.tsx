import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Card from "@src/components/ui/Card";
import PrimaryButton from "@src/components/ui/PrimaryButton";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// 餐次到点提醒 modal（占位 UI，按 Figma 1:265 早餐提醒卡）
// 业务接入（meal window 监听 / 跳转 photo flow / HP 加分）留 §11.K 第 7 项

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

type Props = {
  slot: MealSlot;
  onCapture: () => void;
  onDismiss: () => void;
};

export default function MealReminderModal({ slot, onCapture, onDismiss }: Props) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <View className="flex-1 px-6 justify-center">
        <Card style={{ paddingVertical: 28, alignItems: "center" }}>
          <Image
            source={require("../../../assets/mascot/reminder.png")}
            style={{ width: 156, height: 142 }}
            resizeMode="contain"
          />
          <Text
            className="font-semibold mt-4"
            style={{ fontSize: 24, color: colors.brand.greenDark }}
          >
            {SLOT_LABEL[slot]}时间到啦!
          </Text>
          <Text
            className="text-center mt-2"
            style={{ fontSize: 14, color: colors.ink.sub, lineHeight: 22 }}
          >
            拍一张你正在吃的就行，{"\n"}哪怕只是一杯牛奶。
          </Text>
          <View className="w-full mt-6">
            <PrimaryButton label="去拍照" onPress={onCapture} />
          </View>
          <Text
            className="mt-4"
            style={{ fontSize: 13, color: colors.ink.muted }}
            onPress={onDismiss}
          >
            稍后再说
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}
