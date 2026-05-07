import { View, Text, Pressable, Image } from "react-native";
import type { MealSlot } from "@src/types";

// 未完成（错过餐）卡（按 Figma 10:116）
//
// 主页第二板块的"未在窗口内 + 有未 ack 的 missed slot"时显示。
// 用户点"我知道了" → onAcknowledge → 卡片消失。

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
        backgroundColor: "#FEFBF6",
        borderColor: "#FDE7D4",
        borderWidth: 1,
        borderRadius: 23,
        paddingHorizontal: 22,
        paddingVertical: 22,
      }}
    >
      <Text
        className="font-medium"
        style={{ fontSize: 15, color: "#F6A643" }}
      >
        未完成（血量大幅减少）
      </Text>

      <View className="flex-row items-start mt-4">
        <Image
          source={require("../../../assets/mascot/missed.png")}
          style={{ width: 84, height: 76 }}
          resizeMode="contain"
        />
        <View className="flex-1 pl-3 pt-1">
          <Text style={{ fontSize: 16, color: "#6B6E71", lineHeight: 22 }}>
            你错过了{SLOT_LABEL[slot]}...
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 15, color: "#55585C", lineHeight: 20 }}
          >
            我好饿，好难受...
          </Text>
          <View className="flex-row items-center mt-3">
            <Text style={{ fontSize: 15, color: "#6C7072" }}>血量 </Text>
            <Text
              className="font-semibold"
              style={{ fontSize: 16, color: "#F16758" }}
            >
              -10
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onAcknowledge}
        className="mt-4 rounded-2xl items-center justify-center"
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
          我知道了
        </Text>
      </Pressable>
    </View>
  );
}
