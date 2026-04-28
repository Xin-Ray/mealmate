import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStore } from "@src/store/useStore";
import type { MealSlot } from "@src/types";

const parseHHmm = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export default function ScheduleScreen() {
  const router = useRouter();
  const schedules = useStore((s) => s.mealSchedules);
  const setMealSchedule = useStore((s) => s.setMealSchedule);
  const [pickerOpenFor, setPickerOpenFor] = useState<MealSlot | null>(null);

  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-sub text-sm">第 2 / 4 步</Text>
        <Text className="text-ink text-2xl font-semibold mt-2">三餐推送时间</Text>
        <Text className="text-sub text-sm mt-2">
          我会按这些时间提醒你吃饭。可以之后随时改。
        </Text>

        <View className="mt-8">
          {slots.map((s) => (
            <View
              key={s}
              className="flex-row items-center justify-between border border-cardBorder bg-white rounded-2xl px-5 py-4 mb-3"
            >
              <Text className="text-ink text-base font-medium">{SLOT_LABEL[s]}</Text>
              <Pressable
                onPress={() => setPickerOpenFor(s)}
                className="px-3 py-2 rounded-xl bg-hpEmpty"
              >
                <Text className="text-ink text-base font-mono">{schedules[s]}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {pickerOpenFor && (
          <DateTimePicker
            value={parseHHmm(schedules[pickerOpenFor])}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              if (date) setMealSchedule(pickerOpenFor, fmt(date));
              if (Platform.OS !== "ios") setPickerOpenFor(null);
            }}
          />
        )}
        {pickerOpenFor && Platform.OS === "ios" && (
          <Pressable
            onPress={() => setPickerOpenFor(null)}
            className="self-end mt-2 px-4 py-2 rounded-xl bg-hpEmpty"
          >
            <Text className="text-ink">完成</Text>
          </Pressable>
        )}

        <View className="flex-1" />

        <Pressable
          onPress={() => router.push("/onboarding/name")}
          className="rounded-2xl py-4 items-center mb-6 bg-accent"
        >
          <Text className="text-base font-semibold text-white">下一步</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
