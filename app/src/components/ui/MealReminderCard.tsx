import { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// Active 提醒卡（按 Figma 12:119）
//
// 主页第二板块的"该 slot 在窗口内 + 未 done"时显示。
// 内部每秒 tick 倒计时到 windowEnd。

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const fmtCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

type Props = {
  slot: MealSlot;
  windowEnd: Date;
  onPressGoPhoto: () => void;
};

export default function MealReminderCard({ slot, windowEnd, onPressGoPhoto }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainMs = windowEnd.getTime() - now.getTime();
  const countdown = fmtCountdown(remainMs);

  return (
    <View
      style={{
        backgroundColor: "#FBFAF1",
        borderColor: "#E2E8CF",
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 24,
        paddingVertical: 28,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <Text
            className="font-semibold"
            style={{ fontSize: 24, color: "#4A7048", lineHeight: 30 }}
          >
            {SLOT_LABEL[slot]}时间到啦!
          </Text>
          <Text
            className="mt-2"
            style={{ fontSize: 14, color: "#747571", lineHeight: 20 }}
          >
            记得在 1.5 小时内拍照记录哦~
          </Text>
        </View>
        <Image
          source={require("../../../assets/mascot/reminder.png")}
          style={{ width: 78, height: 71 }}
          resizeMode="contain"
        />
      </View>

      <View className="items-center mt-5">
        <Text
          className="font-semibold"
          style={{ fontSize: 36, color: "#3A6436", lineHeight: 44 }}
        >
          {countdown}
        </Text>
        <Text className="mt-1" style={{ fontSize: 13, color: "#A2A598" }}>
          剩余时间
        </Text>
      </View>

      <Pressable
        onPress={onPressGoPhoto}
        className="mt-5 rounded-3xl items-center justify-center"
        style={{
          backgroundColor: "#60883B",
          borderWidth: 1,
          borderColor: "#7B9A5D",
          paddingVertical: 16,
        }}
      >
        <Text
          className="font-semibold"
          style={{ fontSize: 18, color: "#CDD9C3" }}
        >
          去拍照
        </Text>
      </Pressable>

      <Text
        className="text-center mt-3"
        style={{ fontSize: 11, color: "#B7BAA9" }}
      >
        超过时间将无法获得额外奖励哦~
      </Text>
    </View>
  );
}
