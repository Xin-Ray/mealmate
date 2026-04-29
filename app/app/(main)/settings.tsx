import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch, TextInput, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStore } from "@src/store/useStore";
import type { MealSlot } from "@src/types";

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const parseHHmm = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};
const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export default function SettingsScreen() {
  const router = useRouter();
  const robotName = useStore((s) => s.robotName);
  const setRobotName = useStore((s) => s.setRobotName);
  const gentleMode = useStore((s) => s.gentleMode);
  const setGentleMode = useStore((s) => s.setGentleMode);
  const chatGPTLinked = useStore((s) => s.chatGPTLinked);
  const setChatGPTLinked = useStore((s) => s.setChatGPTLinked);
  const schedules = useStore((s) => s.mealSchedules);
  const setMealSchedule = useStore((s) => s.setMealSchedule);
  const resetAll = useStore((s) => s.resetAll);
  const hp = useStore((s) => s.hp);
  const currentStage = useStore((s) => s.currentStage);
  const devSetHp = useStore((s) => s.__dev_setHp);
  const devSetStage = useStore((s) => s.__dev_setStage);
  const devResetToday = useStore((s) => s.__dev_resetToday);

  const [pickerOpenFor, setPickerOpenFor] = useState<MealSlot | null>(null);
  const [name, setName] = useState(robotName);

  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];

  const onDeleteAccount = () => {
    Alert.alert("删除账号", "会清空所有本地数据，无法找回。", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await resetAll();
          router.replace("/onboarding/eating");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-ink text-2xl font-semibold">设置</Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sub text-sm">返回</Text>
          </Pressable>
        </View>

        {/* 推送时间 */}
        <Text className="text-sub text-xs mb-2">推送时间</Text>
        <View className="bg-white border border-cardBorder rounded-2xl mb-6">
          {slots.map((s, i) => (
            <View
              key={s}
              className={`flex-row items-center justify-between px-5 py-4 ${
                i < slots.length - 1 ? "border-b border-cardBorder" : ""
              }`}
            >
              <Text className="text-ink text-base">{SLOT_LABEL[s]}</Text>
              <Pressable
                onPress={() => setPickerOpenFor(s)}
                className="px-3 py-2 rounded-xl bg-hpEmpty"
              >
                <Text className="text-ink font-mono">{schedules[s]}</Text>
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
            className="self-end mb-4 px-4 py-2 rounded-xl bg-hpEmpty"
          >
            <Text className="text-ink">完成</Text>
          </Pressable>
        )}

        {/* 机器人名字 */}
        <Text className="text-sub text-xs mb-2">机器人名字</Text>
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-6 flex-row items-center">
          <TextInput
            className="flex-1 text-ink text-base"
            value={name}
            onChangeText={setName}
            onBlur={() => setRobotName(name)}
            maxLength={12}
          />
          <Pressable onPress={() => setRobotName(name)} className="px-3 py-1 rounded-lg bg-accent">
            <Text className="text-white text-sm">保存</Text>
          </Pressable>
        </View>

        {/* 温柔模式 */}
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-3 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-ink text-base">温柔模式</Text>
            <Text className="text-sub text-xs mt-1">
              错过一餐时只扣 0.5 HP；语气更轻。
            </Text>
          </View>
          <Switch value={gentleMode} onValueChange={setGentleMode} />
        </View>

        {/* ChatGPT 链接 */}
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-6 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-ink text-base">
              ChatGPT 账号 {chatGPTLinked ? "（已连接）" : "（未连接）"}
            </Text>
            <Text className="text-sub text-xs mt-1">
              连接后台占位，OAuth 真接入会在后续版本上线。
            </Text>
          </View>
          <Pressable
            onPress={() => setChatGPTLinked(!chatGPTLinked)}
            className="px-3 py-2 rounded-xl bg-hpEmpty"
          >
            <Text className="text-ink text-sm">
              {chatGPTLinked ? "断开" : "连接"}
            </Text>
          </Pressable>
        </View>

        {/* 帮助 / 隐私 */}
        <Text className="text-sub text-xs mb-2">关于</Text>
        <View className="bg-white border border-cardBorder rounded-2xl mb-6">
          <Pressable
            className="px-5 py-4 border-b border-cardBorder"
            onPress={() => Alert.alert("隐私政策", "占位 — 上线前会替换为正式文案。")}
          >
            <Text className="text-ink">隐私政策</Text>
          </Pressable>
          <Pressable
            className="px-5 py-4"
            onPress={() => Alert.alert("求助资源", "占位 — 会替换为大陆地区可拨打的资源（如 12320 等）。")}
          >
            <Text className="text-ink">求助资源</Text>
          </Pressable>
        </View>

        {/* 危险区 */}
        <Pressable
          onPress={onDeleteAccount}
          className="rounded-2xl py-4 items-center bg-bad/10 border border-bad"
        >
          <Text className="text-bad font-semibold">删除账号 / 重置数据</Text>
        </Pressable>

        {/* 开发者模式：仅 dev build 显示 */}
        {__DEV__ && (
          <>
            <Text className="text-sub text-xs mt-8 mb-2">开发者（仅 dev build）</Text>
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-3">
              <Text className="text-ink text-sm mb-2">HP（当前 {hp}/15）</Text>
              <View className="flex-row gap-2">
                {[0, 4, 8, 12, 15].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => devSetHp(v)}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      hp === v ? "bg-accent" : "bg-hpEmpty"
                    }`}
                  >
                    <Text className={hp === v ? "text-white" : "text-ink"}>
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-3">
              <Text className="text-ink text-sm mb-2">
                阶段（当前 Stage {currentStage}）
              </Text>
              <View className="flex-row gap-2">
                {([1, 2] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => devSetStage(s)}
                    className={`flex-1 py-2 rounded-xl items-center ${
                      currentStage === s ? "bg-accent" : "bg-hpEmpty"
                    }`}
                  >
                    <Text
                      className={
                        currentStage === s ? "text-white" : "text-ink"
                      }
                    >
                      Stage {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={() => {
                devResetToday();
                Alert.alert("已重置", "今日三餐状态已清空。");
              }}
              className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-3"
            >
              <Text className="text-ink">重置今日三餐</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await resetAll();
                router.replace("/onboarding/eating");
              }}
              className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-3"
            >
              <Text className="text-ink">重置 onboarding（清全部数据）</Text>
            </Pressable>

            <View className="bg-white/50 border border-cardBorder rounded-2xl px-5 py-4 mb-3 opacity-50">
              <Text className="text-sub text-sm">
                立即触发餐次提醒弹窗（B1 / A3 完成后启用）
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
