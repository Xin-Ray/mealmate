// 错过餐补救卡（issue #3 v10）
//
// 用在 HomeMealStatusSlot 的 "今日有 missed + 未 madeUp" 分支
// （替代之前的 MealIncompleteCard —— 那个只让用户"我知道了"算了，
// 这个让用户去补救：拍照后 madeUp + HP +10 净变化 0）。
//
// 调性：温和正向（不是惩罚，是再给一次机会）。
// 视觉：浅米黄底 + 浅绿边（同 MealReminderCard 配色，但用 missed.png mascot
// 而不是 reminder.png，提示用户这是错过的餐）。

import { View, Text, Pressable, Image } from "react-native";
import type { MealSlot } from "@src/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

type Props = {
  slot: MealSlot;
  onPressGoMakeUp: () => void;
};

export default function MealMakeUpCard({ slot, onPressGoMakeUp }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#FBFAF1",
        borderColor: "#E2E8CF",
        borderWidth: 1,
        borderRadius: 23,
        paddingHorizontal: 22,
        paddingVertical: 22,
      }}
    >
      <Text
        className="font-medium"
        style={{ fontSize: 15, color: "#3A6436" }}
      >
        错过的餐还能补
      </Text>

      <View className="flex-row items-start mt-4">
        <Image
          source={require("../../../assets/mascot/missed.png")}
          style={{ width: 84, height: 76 }}
          resizeMode="contain"
        />
        <View className="flex-1 pl-3 pt-1">
          <Text style={{ fontSize: 16, color: "#3A2E22", lineHeight: 22 }}>
            你刚才错过了{SLOT_LABEL[slot]}...
          </Text>
          <Text
            className="mt-1"
            style={{ fontSize: 15, color: "#6B6E71", lineHeight: 20 }}
          >
            现在吃也算，拍一张补救
          </Text>
          <View className="flex-row items-center mt-3">
            <Text style={{ fontSize: 13, color: "#6C7072" }}>血量将恢复 </Text>
            <Text
              className="font-semibold"
              style={{ fontSize: 14, color: "#3A6436" }}
            >
              +10
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onPressGoMakeUp}
        className="mt-4 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: "#60883B",
          paddingVertical: 13,
        }}
      >
        <Text
          className="font-semibold"
          style={{ fontSize: 15, color: "#FFFFFF" }}
        >
          去拍照补救
        </Text>
      </Pressable>
    </View>
  );
}
