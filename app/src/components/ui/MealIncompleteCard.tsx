import { View, Text, Pressable } from "react-native";
import type { MealSlot } from "@src/types";

// 未完成（错过餐）卡（按 Figma 10:116）
//
// v1.2.5 build 13 重写:
//   - 移除 mascot 图(missed.png 已=full.png 但移除整个 Image 节点更彻底)
//   - 移除「血量 -10」红色 badge / 红字
//   - 文案改纯鼓励调:不出现「错过/漏/-」,中性「这餐没拍上」
//   - 边框 + 标题 from 橘色 → 灰绿(无警告感)
//
// 渲染条件:HomeMealStatusSlot 只在 missedMealRemindersEnabled=true 时调本卡;
// 默认关闭 → 用户根本看不到。所以本卡里仍可有「我知道了」让 ack 走通。

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

type Props = {
  slot: MealSlot;
  onAcknowledge: () => void;
};

export default function MealIncompleteCard({ slot, onAcknowledge }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#FCFCFC",
        borderColor: "#E6E8DF",
        borderWidth: 1,
        borderRadius: 23,
        paddingHorizontal: 22,
        paddingVertical: 22,
      }}
    >
      <Text
        className="font-medium"
        style={{ fontSize: 15, color: "#6E6F6C" }}
      >
        {SLOT_LABEL[slot]}这餐没拍上
      </Text>
      <Text
        className="mt-2"
        style={{ fontSize: 14, color: "#7B7E80", lineHeight: 20 }}
      >
        没关系,下一顿等你 🌱
      </Text>

      <Pressable
        onPress={onAcknowledge}
        className="mt-5 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: "#508729",
          borderWidth: 1,
          borderColor: "#77A159",
          paddingVertical: 13,
        }}
      >
        <Text
          className="font-semibold"
          style={{ fontSize: 15, color: "#E6F0E0" }}
        >
          知道了
        </Text>
      </Pressable>
    </View>
  );
}
