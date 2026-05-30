import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useStore, type Ethnicity, type Gender } from "@src/store/useStore";
import { hpBandFromValue, pickDialogue } from "@src/data/dialogues";
import { triggerTestNotification } from "@src/services/notifications";
import { selectStandardWeight } from "@src/store/selectors/standardWeight";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";
import type { MealSlot } from "@src/types";

// 我的页（v0.4 §11.K 第 9 项 token 化）
// 用 Card 卡片 / colors.* / 统一 section 间距。功能保留：推送时间 / 名字 /
// 温柔模式 / 跳过称重照片 / 关于 / 危险区 / 开发者面板（仅 __DEV__）。

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
const fmtHHmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

// Section header（小灰字标题，section 之间分隔）
const SectionLabel = ({ children }: { children: string }) => (
  <Text
    className="mb-2"
    style={{ fontSize: 12, color: colors.ink.sub, marginTop: 8 }}
  >
    {children}
  </Text>
);

const Divider = () => (
  <View
    style={{
      height: 1,
      backgroundColor: colors.border.card,
      marginHorizontal: -20, // 抵消 Card 内 px=20，让分隔线贴边
    }}
  />
);

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: "female", label: "女" },
  { id: "male", label: "男" },
  { id: "other", label: "其它" },
];
const ETHNICITY_OPTIONS: { id: Ethnicity; label: string }[] = [
  { id: "asian", label: "亚裔" },
  { id: "other", label: "其它" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const robotName = useStore((s) => s.robotName);
  const setRobotName = useStore((s) => s.setRobotName);
  const gentleMode = useStore((s) => s.gentleMode);
  const setGentleMode = useStore((s) => s.setGentleMode);
  const skipWeightPhoto = useStore((s) => s.skipWeightPhoto);
  const setSkipWeightPhoto = useStore((s) => s.setSkipWeightPhoto);
  const schedules = useStore((s) => s.mealSchedules);
  const setMealSchedule = useStore((s) => s.setMealSchedule);
  const resetAll = useStore((s) => s.resetAll);
  const hp = useStore((s) => s.hp);
  const currentStage = useStore((s) => s.currentStage);
  const devSetHp = useStore((s) => s.__dev_setHp);
  const devSetStage = useStore((s) => s.__dev_setStage);
  const devResetToday = useStore((s) => s.__dev_resetToday);

  // v1.1 健康数据
  const height = useStore((s) => s.height);
  const gender = useStore((s) => s.gender);
  const ethnicity = useStore((s) => s.ethnicity);
  const targetWeight = useStore((s) => s.targetWeight);
  const setHeight = useStore((s) => s.setHeight);
  const setGender = useStore((s) => s.setGender);
  const setEthnicity = useStore((s) => s.setEthnicity);
  const setTargetWeight = useStore((s) => s.setTargetWeight);
  const standardWeight = selectStandardWeight({ height, ethnicity });

  const [pickerOpenFor, setPickerOpenFor] = useState<MealSlot | null>(null);
  const [name, setName] = useState(robotName);
  const [heightText, setHeightText] = useState(
    height != null ? String(height) : ""
  );
  const [targetText, setTargetText] = useState(
    targetWeight != null ? targetWeight.toFixed(1) : ""
  );

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        <Text
          className="font-semibold mb-1"
          style={{ fontSize: 24, color: colors.ink.primary }}
        >
          我的
        </Text>

        {/* v1.1 健康数据（doc §十三 入口 1 — 永久入口） */}
        <SectionLabel>健康数据</SectionLabel>
        <Card style={{ paddingVertical: 0, paddingHorizontal: 20 }}>
          {/* 身高 */}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 16, color: colors.ink.primary }}>
              身高 (cm)
            </Text>
            <View
              style={{
                backgroundColor: colors.bg.hpEmpty,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                minWidth: 80,
              }}
            >
              <TextInput
                value={heightText}
                onChangeText={setHeightText}
                onBlur={() => {
                  const n = parseInt(heightText, 10);
                  if (!isNaN(n) && n >= 80 && n <= 250) setHeight(n);
                  else if (heightText === "") setHeight(null);
                }}
                keyboardType="numeric"
                maxLength={3}
                placeholder="—"
                style={{ textAlign: "center", color: colors.ink.primary }}
              />
            </View>
          </View>
          <Divider />
          {/* 性别 */}
          <View style={{ paddingVertical: 14 }}>
            <Text
              style={{ fontSize: 16, color: colors.ink.primary, marginBottom: 8 }}
            >
              性别
            </Text>
            <View className="flex-row gap-2">
              {GENDER_OPTIONS.map((g) => {
                const active = gender === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => setGender(g.id)}
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{
                      backgroundColor: active
                        ? colors.brand.green
                        : colors.bg.hpEmpty,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#FFFFFF" : colors.ink.primary,
                        fontSize: 14,
                      }}
                    >
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Divider />
          {/* 族裔 */}
          <View style={{ paddingVertical: 14 }}>
            <Text
              style={{ fontSize: 16, color: colors.ink.primary, marginBottom: 8 }}
            >
              族裔
            </Text>
            <View className="flex-row gap-2">
              {ETHNICITY_OPTIONS.map((e) => {
                const active = ethnicity === e.id;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => setEthnicity(e.id)}
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{
                      backgroundColor: active
                        ? colors.brand.green
                        : colors.bg.hpEmpty,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#FFFFFF" : colors.ink.primary,
                        fontSize: 14,
                      }}
                    >
                      {e.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text
              style={{ fontSize: 11, color: colors.ink.sub, marginTop: 6 }}
            >
              亚裔 BMI 健康值 21，其它 22
            </Text>
          </View>
          <Divider />
          {/* 标准体重（read-only 算出） */}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingVertical: 14 }}
          >
            <View>
              <Text style={{ fontSize: 16, color: colors.ink.primary }}>
                健康体重
              </Text>
              <Text style={{ fontSize: 11, color: colors.ink.sub, marginTop: 2 }}>
                按 BMI × 身高² 算
              </Text>
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.brand.green,
              }}
            >
              {standardWeight != null ? `${standardWeight.toFixed(1)} kg` : "—"}
            </Text>
          </View>
          <Divider />
          {/* 目标体重 */}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingVertical: 14 }}
          >
            <View>
              <Text style={{ fontSize: 16, color: colors.ink.primary }}>
                目标体重 (kg)
              </Text>
              <Text style={{ fontSize: 11, color: colors.ink.sub, marginTop: 2 }}>
                stage 5 ±2.5kg 区间判定用
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.bg.hpEmpty,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 10,
                minWidth: 80,
              }}
            >
              <TextInput
                value={targetText}
                onChangeText={setTargetText}
                onBlur={() => {
                  const n = parseFloat(targetText);
                  if (!isNaN(n) && n >= 20 && n <= 200) setTargetWeight(n);
                  else if (targetText === "") setTargetWeight(null);
                }}
                keyboardType="numeric"
                maxLength={5}
                placeholder="—"
                style={{ textAlign: "center", color: colors.ink.primary }}
              />
            </View>
          </View>
        </Card>

        {/* 推送时间 */}
        <SectionLabel>推送时间</SectionLabel>
        <Card style={{ paddingVertical: 0, paddingHorizontal: 20 }}>
          {slots.map((s, i) => (
            <View key={s}>
              <View
                className="flex-row items-center justify-between"
                style={{ paddingVertical: 16 }}
              >
                <Text style={{ fontSize: 16, color: colors.ink.primary }}>
                  {SLOT_LABEL[s]}
                </Text>
                <Pressable
                  onPress={() => setPickerOpenFor(s)}
                  className="px-3 py-2 rounded-xl"
                  style={{ backgroundColor: colors.bg.hpEmpty }}
                >
                  <Text
                    className="font-mono"
                    style={{ color: colors.ink.primary }}
                  >
                    {schedules[s]}
                  </Text>
                </Pressable>
              </View>
              {i < slots.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {pickerOpenFor && (
          <DateTimePicker
            value={parseHHmm(schedules[pickerOpenFor])}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              if (date) setMealSchedule(pickerOpenFor, fmtHHmm(date));
              if (Platform.OS !== "ios") setPickerOpenFor(null);
            }}
          />
        )}
        {pickerOpenFor && Platform.OS === "ios" && (
          <Pressable
            onPress={() => setPickerOpenFor(null)}
            className="self-end mt-2 mb-2 px-4 py-2 rounded-xl"
            style={{ backgroundColor: colors.bg.hpEmpty }}
          >
            <Text style={{ color: colors.ink.primary }}>完成</Text>
          </Pressable>
        )}

        {/* 机器人名字 */}
        <SectionLabel>机器人名字</SectionLabel>
        <Card style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            className="flex-1"
            style={{ fontSize: 16, color: colors.ink.primary }}
            value={name}
            onChangeText={setName}
            onBlur={() => setRobotName(name)}
            maxLength={12}
          />
          <Pressable
            onPress={() => setRobotName(name)}
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: colors.brand.green }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 14 }}>保存</Text>
          </Pressable>
        </Card>

        {/* 偏好开关 */}
        <SectionLabel>偏好</SectionLabel>
        <Card style={{ paddingVertical: 0, paddingHorizontal: 20 }}>
          <View
            className="flex-row items-center justify-between"
            style={{ paddingVertical: 16 }}
          >
            <View className="flex-1 pr-3">
              <Text style={{ fontSize: 16, color: colors.ink.primary }}>
                温柔模式
              </Text>
              <Text
                className="mt-1"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                错过一餐时只扣 5 HP（默认 -10）；语气更轻。
              </Text>
            </View>
            <Switch value={gentleMode} onValueChange={setGentleMode} />
          </View>
          <Divider />
          <View
            className="flex-row items-center justify-between"
            style={{ paddingVertical: 16 }}
          >
            <View className="flex-1 pr-3">
              <Text style={{ fontSize: 16, color: colors.ink.primary }}>
                称重时跳过拍照
              </Text>
              <Text
                className="mt-1"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                开启后只输数字、不拍体重秤。默认关闭。
              </Text>
            </View>
            <Switch value={skipWeightPhoto} onValueChange={setSkipWeightPhoto} />
          </View>
        </Card>

        {/* 关于 */}
        <SectionLabel>关于</SectionLabel>
        <Card style={{ paddingVertical: 0, paddingHorizontal: 20 }}>
          <Pressable
            style={{ paddingVertical: 16 }}
            onPress={() =>
              Alert.alert("隐私政策", "占位 — 上线前会替换为正式文案。")
            }
          >
            <Text style={{ fontSize: 16, color: colors.ink.primary }}>
              隐私政策
            </Text>
          </Pressable>
          <Divider />
          <Pressable
            style={{ paddingVertical: 16 }}
            onPress={() =>
              Alert.alert(
                "求助资源",
                "占位 — 会替换为大陆地区可拨打的资源（如 12320 等）。"
              )
            }
          >
            <Text style={{ fontSize: 16, color: colors.ink.primary }}>
              求助资源
            </Text>
          </Pressable>
        </Card>

        {/* 危险区 */}
        <View style={{ marginTop: 20 }}>
          <Pressable
            onPress={onDeleteAccount}
            className="rounded-2xl py-4 items-center"
            style={{
              backgroundColor: `${colors.status.bad}1A`,
              borderWidth: 1,
              borderColor: colors.status.bad,
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: colors.status.bad }}
            >
              删除账号 / 重置数据
            </Text>
          </Pressable>
        </View>

        {/* 开发者模式：仅 dev build 显示 */}
        {__DEV__ && (
          <>
            <SectionLabel>开发者（仅 dev build）</SectionLabel>

            <Card style={{ marginBottom: 12 }}>
              <Text
                className="mb-2"
                style={{ fontSize: 14, color: colors.ink.primary }}
              >
                HP（当前 {hp}/100）
              </Text>
              <View className="flex-row gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => devSetHp(v)}
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        hp === v ? colors.brand.green : colors.bg.hpEmpty,
                    }}
                  >
                    <Text
                      style={{
                        color: hp === v ? "#FFFFFF" : colors.ink.primary,
                      }}
                    >
                      {v}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card style={{ marginBottom: 12 }}>
              <Text
                className="mb-2"
                style={{ fontSize: 14, color: colors.ink.primary }}
              >
                阶段（当前 Stage {currentStage}）
              </Text>
              <View className="flex-row gap-2">
                {([1, 2, 3, 4, 5] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => devSetStage(s)}
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        currentStage === s
                          ? colors.brand.green
                          : colors.bg.hpEmpty,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          currentStage === s ? "#FFFFFF" : colors.ink.primary,
                      }}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            {/* 重置 / 清空动作（共用一个 Card 容器分隔线分项） */}
            <Card style={{ paddingVertical: 0, paddingHorizontal: 20 }}>
              {[
                {
                  label: "重置今日三餐",
                  onPress: () => {
                    devResetToday();
                    Alert.alert("已重置", "今日三餐状态已清空。");
                  },
                },
                {
                  label: "重置 onboarding（清全部数据）",
                  onPress: async () => {
                    await resetAll();
                    router.replace("/onboarding/eating");
                  },
                },
                {
                  label: "清空饱腹度评分",
                  onPress: () => {
                    useStore.getState().__dev_clearFullnessHistory();
                    Alert.alert("已清空", "饱腹度评分历史已清空。");
                  },
                },
                {
                  label: "清空餐次记录",
                  onPress: () => {
                    useStore.getState().__dev_clearMealRecords();
                    Alert.alert("已清空", "餐次记录历史已清空。");
                  },
                },
                {
                  label: "清空对话历史",
                  onPress: () => {
                    useStore.getState().__dev_clearDialogueHistory();
                    Alert.alert("已清空", "对话历史已清空。");
                  },
                },
              ].map((row, i, arr) => (
                <View key={row.label}>
                  <Pressable
                    onPress={row.onPress}
                    style={{ paddingVertical: 14 }}
                  >
                    <Text style={{ fontSize: 15, color: colors.ink.primary }}>
                      {row.label}
                    </Text>
                  </Pressable>
                  {i < arr.length - 1 && <Divider />}
                </View>
              ))}
            </Card>

            <Text
              className="mt-4 mb-2"
              style={{ fontSize: 14, color: colors.ink.primary }}
            >
              立即触发餐次提醒（5 秒后弹）
            </Text>
            <View className="flex-row gap-2 mb-3">
              {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={async () => {
                    const band = hpBandFromValue(hp);
                    const line = pickDialogue(band, s);
                    await triggerTestNotification(
                      s,
                      line?.text ?? "该吃饭啦～"
                    );
                    Alert.alert(
                      "已安排",
                      `5 秒后会弹出${SLOT_LABEL[s]}测试推送。可以把 app 切到后台观察。`
                    );
                  }}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.bg.hpEmpty }}
                >
                  <Text style={{ color: colors.ink.primary }}>
                    {SLOT_LABEL[s]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Transitions 测试（feature/stage-transitions） */}
            <Text
              className="mt-4 mb-2"
              style={{ fontSize: 14, color: colors.ink.primary }}
            >
              Transitions 测试（HP 边界 + modal）
            </Text>
            <Card style={{ marginBottom: 12 }}>
              <Text className="mb-2" style={{ fontSize: 12, color: colors.ink.sub }}>
                触发真实流程（改 store + 弹 modal）
              </Text>
              <View className="flex-row gap-2 mb-2">
                <Pressable
                  onPress={() => useStore.getState().advanceStage()}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.brand.green }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                    advance ↑
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => useStore.getState().demoteStage()}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.brand.accent }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 13 }}>
                    demote ↓
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => useStore.getState().__dev_resetTransitions()}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.bg.hpEmpty }}
                >
                  <Text style={{ color: colors.ink.primary, fontSize: 13 }}>
                    reset seen
                  </Text>
                </Pressable>
              </View>
              {/* 一键场景：stage 1 失败（按 PRD §11.L 测试支持调 modal + failure 留账） */}
              <Pressable
                onPress={() => {
                  const s = useStore.getState();
                  s.__dev_setStage(1);
                  s.demoteStage();
                }}
                className="py-2 rounded-xl items-center mb-3"
                style={{ backgroundColor: "#FFEFD8" }}
              >
                <Text
                  style={{ color: colors.brand.accentDark, fontSize: 13 }}
                >
                  模拟 stage 1 失败（support modal + failure 留账）
                </Text>
              </Pressable>

              <Text className="mb-2" style={{ fontSize: 12, color: colors.ink.sub }}>
                跳屏（单测，不改 state；v0.5 Plan B 走 /(stage)/）
              </Text>
              <Pressable
                onPress={() =>
                  router.replace("/(stage)/stage-1-start" as never)
                }
                className="py-2 rounded-xl items-center mb-2"
                style={{ backgroundColor: colors.bg.hpEmpty }}
              >
                <Text style={{ color: colors.ink.primary, fontSize: 13 }}>
                  stage-1-start
                </Text>
              </Pressable>
              <View className="flex-row gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={`end-${n}`}
                    onPress={() =>
                      router.replace(`/(stage)/stage-${n}-end` as never)
                    }
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{ backgroundColor: colors.bg.hpEmpty }}
                  >
                    <Text
                      style={{ color: colors.ink.primary, fontSize: 12 }}
                    >
                      {n} end
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={`demote-${n}`}
                    onPress={() =>
                      router.replace(`/(stage)/stage-${n}-demote` as never)
                    }
                    className="flex-1 py-2 rounded-xl items-center"
                    style={{ backgroundColor: "#FFEFD8" }}
                  >
                    <Text
                      style={{ color: colors.brand.accentDark, fontSize: 12 }}
                    >
                      {n} dem
                    </Text>
                  </Pressable>
                ))}
              </View>
              {/* v1.1: stage-4/5 start 也加上（v0.5 删过现在 v1.1 加回）*/}
              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() =>
                    router.replace("/(stage)/stage-1-start" as never)
                  }
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: "#E8F2D8" }}
                >
                  <Text style={{ color: "#3D683F", fontSize: 12 }}>
                    1 start
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.replace("/(stage)/stage-4-start" as never)
                  }
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: "#E8F2D8" }}
                >
                  <Text style={{ color: "#3D683F", fontSize: 12 }}>
                    4 start
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.replace("/(stage)/stage-5-start" as never)
                  }
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: "#E8F2D8" }}
                >
                  <Text style={{ color: "#3D683F", fontSize: 12 }}>
                    5 start
                  </Text>
                </Pressable>
              </View>
            </Card>

            {/* v1.1 验证按钮（doc §九）*/}
            <Text
              className="mt-4 mb-2"
              style={{ fontSize: 14, color: colors.ink.primary }}
            >
              v1.1 stage 4/5 验证
            </Text>
            <Card style={{ marginBottom: 12 }}>
              <Text
                className="mb-2"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                一键 seed 体质 + 目标体重
              </Text>
              <View className="flex-row gap-2 mb-2">
                <Pressable
                  onPress={() => {
                    setHeight(170);
                    setEthnicity("asian");
                    setGender("other");
                    setHeightText("170");
                    Alert.alert(
                      "已 seed",
                      "height=170, ethnicity=asian → 健康体重 60.7kg"
                    );
                  }}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.brand.green }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
                    Set h=170 / asian
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setTargetWeight(62);
                    setTargetText("62.0");
                    Alert.alert("已 seed", "目标体重 = 62kg");
                  }}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.brand.green }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
                    Set target=62
                  </Text>
                </Pressable>
              </View>
              <Text
                className="mb-2"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                Seed 体重数据
              </Text>
              <View className="flex-row gap-2 mb-2">
                <Pressable
                  onPress={() => {
                    // 加单条 60.5kg（stage 4 下未达标，stage 5 下在区间内）
                    useStore.getState().addWeightRecord({
                      kg: 60.5,
                      photoUri: "",
                    });
                    Alert.alert("已加", "今日体重 60.5kg");
                  }}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.bg.hpEmpty }}
                >
                  <Text style={{ color: colors.ink.primary, fontSize: 12 }}>
                    + 60.5kg today
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    // 加 62.5kg（≥ target=62）触发 stage 4→5
                    useStore.getState().addWeightRecord({
                      kg: 62.5,
                      photoUri: "",
                    });
                    Alert.alert(
                      "已加",
                      "今日体重 62.5kg（stage 4 → 触发 advance 5）"
                    );
                  }}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{ backgroundColor: colors.bg.hpEmpty }}
                >
                  <Text style={{ color: colors.ink.primary, fontSize: 12 }}>
                    + 62.5kg today
                  </Text>
                </Pressable>
              </View>
              <Text
                className="mb-2"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                Stage 5 完成模拟
              </Text>
              <Pressable
                onPress={() => {
                  // 60 天前进入 stage 5 + 给 stage5Stars 1 颗，再加今日体重触发 check
                  const sixtyAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
                  useStore.setState({
                    stage5StartedAt: sixtyAgo,
                    stage5Stars: 8,
                  });
                  useStore.getState().__internal_runStage5Check();
                  Alert.alert(
                    "已触发",
                    "stage5StartedAt = 60 天前 → __internal_runStage5Check 应 push stage-5-end"
                  );
                }}
                className="py-2 rounded-xl items-center mb-2"
                style={{ backgroundColor: colors.brand.green }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
                  Seed stage 5 60 天达成
                </Text>
              </Pressable>
              <Text
                className="mb-2"
                style={{ fontSize: 12, color: colors.ink.sub }}
              >
                Reset profile（清空 v11 字段）
              </Text>
              <Pressable
                onPress={() => {
                  setHeight(null);
                  setGender(null);
                  setEthnicity(null);
                  setTargetWeight(null);
                  setHeightText("");
                  setTargetText("");
                  useStore.setState({
                    stage5StartedAt: null,
                    stage5Stars: 0,
                    stage5LastStarCheck: null,
                  });
                  Alert.alert("已清", "v11 profile + stage5 状态全清空");
                }}
                className="py-2 rounded-xl items-center"
                style={{ backgroundColor: "#FFEFD8" }}
              >
                <Text style={{ color: colors.brand.accentDark, fontSize: 12 }}>
                  Reset v11 profile
                </Text>
              </Pressable>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
