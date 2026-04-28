import { Pressable, Text, View } from "react-native";
import type { MealSlot, MealStatus } from "@src/types";

type Props = {
  slot: MealSlot;
  scheduledAt: string; // "HH:mm"
  status: MealStatus;
  onPress: () => void;
};

const slotLabel: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const statusBadge = (s: MealStatus) => {
  switch (s) {
    case "done":
      return { text: "✓ 已记录", classes: "bg-ok/20 text-ok" };
    case "missed":
      return { text: "× 错过", classes: "bg-bad/20 text-bad" };
    case "pending":
    default:
      return { text: "待记录", classes: "bg-hpEmpty text-sub" };
  }
};

export default function MealCard({ slot, scheduledAt, status, onPress }: Props) {
  const badge = statusBadge(status);
  const disabled = status === "done";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`border rounded-2xl p-4 mb-3 bg-white border-cardBorder ${
        disabled ? "opacity-70" : "active:opacity-80"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-ink text-base font-semibold">{slotLabel[slot]}</Text>
          <Text className="text-sub text-xs mt-1">推送时间 {scheduledAt}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${badge.classes.split(" ")[0]}`}>
          <Text className={`text-xs ${badge.classes.split(" ")[1]}`}>{badge.text}</Text>
        </View>
      </View>
      {status === "pending" && (
        <Text className="text-accent text-sm mt-3">点击拍照记录 →</Text>
      )}
    </Pressable>
  );
}
