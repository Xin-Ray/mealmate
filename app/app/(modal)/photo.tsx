import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useStore,
  HP_MEAL_PHOTO_GAIN,
  HP_SNACK_GAIN,
  SNACK_DAILY_LIMIT,
} from "@src/store/useStore";
import CelebrationModal from "@src/components/photo/CelebrationModal";
import FullnessRatingPicker from "@src/components/ui/FullnessRatingPicker";
import { pickImageWithFallback, type Source } from "@src/services/imagePicker";
import { detectFood, type TopPrediction } from "@src/services/foodDetection";
import type { FullnessScore, MealSlot } from "@src/types";

type Phase = "intro" | "preview" | "uploading" | "rejected" | "result";

// v1.1.1 严格食物验证 + v1.1.2 Food-101 后端：detect 判 is_food=false → 拒绝；
// 网络/服务挂 → 同样拒绝（严格模式无宽容）。区分 reason 给用户准确反馈。
type RejectReason = "no_food" | "network_fail";

const slotLabel: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

// PRD §11.F.1：通过餐推送 2 条 dialogue（"太棒了！X 看起来不错" + 鼓励话）
const ENCOURAGE_LINES = [
  "继续加油哈，这么下去一定可以尽快达到目标的",
  "保持节奏就很好，慢慢来",
  "你今天的努力我都看见了",
  "陪着你吃饭真开心",
  "这一份认真我先收下了",
];

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// v1.2.1 Stage 0 用:wall clock 离哪个 schedule slot 最近就算哪餐
// 让 Stage 0 那张餐照能进 mealRecords + WeekStrip 标亮
const closestSlotByWallClock = (schedules: {
  breakfast: string;
  lunch: string;
  dinner: string;
}): MealSlot => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const parse = (hhmm: string): number => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const dist = (a: number, b: number): number => {
    const d = Math.abs(a - b);
    return Math.min(d, 24 * 60 - d); // wrap-around 距离(凌晨拍仍算 breakfast/dinner)
  };
  const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];
  let best: MealSlot = "lunch";
  let bestD = Infinity;
  for (const slot of slots) {
    const d = dist(nowMin, parse(schedules[slot]));
    if (d < bestD) {
      bestD = d;
      best = slot;
    }
  }
  return best;
};

export default function PhotoScreen() {
  // issue #3 加餐：snack='true' 时走加餐流（addSnack 而非 markMealDone，
  // HP +10、不写 mealRecord、不需要 slot、跳过饱腹度选择）
  const { slot, snack } = useLocalSearchParams<{
    slot?: MealSlot;
    snack?: string;
  }>();
  const isSnack = snack === "true";
  const router = useRouter();
  const markMealDone = useStore((s) => s.markMealDone);
  const addSnack = useStore((s) => s.addSnack);
  const robotName = useStore((s) => s.robotName);
  const pushDialogue = useStore((s) => s.pushDialogue);
  const addFullnessRecord = useStore((s) => s.addFullnessRecord);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const todayKey = useStore((s) => s.todayKey);
  // v1.2.1: Stage 0 用,从 home 进 photo 不带 slot 参数 → 按 wall clock 决定
  const currentStage = useStore((s) => s.currentStage);
  const mealSchedules = useStore((s) => s.mealSchedules);
  const advanceFromStage0 = useStore((s) => s.advanceFromStage0);
  const isStage0 = currentStage === 0;
  // Stage 0 时 slot 没传(home 直接进 photo) → 按 wall clock 算最近 slot
  const realSlot: MealSlot = (slot as MealSlot) ?? (isStage0
    ? closestSlotByWallClock(mealSchedules)
    : "lunch");
  const hpGain = isSnack ? HP_SNACK_GAIN : HP_MEAL_PHOTO_GAIN;

  const [phase, setPhase] = useState<Phase>("intro");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<Source>("camera");
  const [doneLine, setDoneLine] = useState<string>("");
  const [encourageLine, setEncourageLine] = useState<string>("");
  const [topPreds, setTopPreds] = useState<TopPrediction[]>([]);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<RejectReason | null>(null);
  // 同一次进入 photo modal 内是否已经打过卡：防止"重拍"导致重复 +HP / 重复推 dialogue。
  const [confirmedOnce, setConfirmedOnce] = useState(false);
  // v1.1 #14: 庆祝弹窗（doc §八）。进 result phase 自动开，"继续加油" / 点屏跳过 → 关
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [selectedFullness, setSelectedFullness] = useState<FullnessScore | undefined>(
    () =>
      fullnessHistory.find((r) => r.date === todayKey && r.mealSlot === realSlot)
        ?.score
  );

  // HP +5 弹一下的 scale animation
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === "result") {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 220, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [phase, scale]);

  const pickImage = async (source: Source) => {
    setLastSource(source);
    const picked = await pickImageWithFallback(source);
    if (picked) {
      setImageUri(picked.uri);
      setPhase("preview");
    }
  };

  // preview → 用户点"确定" → uploading（真识别）→ result（或 rejected）
  //
  // v1.1.1 起改成严格模式：detect 必须返回 ≥1 个食物才算成功；
  //   - 0 个 detections → rejected('no_food')：不写 HP / 不 push dialogue，只让重拍
  //   - 网络 / 5xx 挂  → rejected('network_fail')：同上拒绝（不再宽容兜底「先打卡再识别」）
  // 防作弊：旧版本任何照片（包括键盘照）都能 +HP，是公认 bug。
  const onConfirm = async () => {
    if (!imageUri) return;

    // issue #3 加餐每日上限 SNACK_DAILY_LIMIT 次（防作弊）：snack 已满 → Alert + 回 home，
    // 不进 uploading / 不写 HP / 不 push dialogue。SnackCard 已经在 home 上
    // 把卡片置 disabled，这层是兜底（防 deep link 绕过 UI 直接进 photo modal）。
    if (isSnack) {
      const s = useStore.getState();
      const today = s.todayKey;
      const todayCount = s.dialogueHistory.filter((d) => {
        if (d.kind !== "snack_done") return false;
        const dd = new Date(d.ts);
        const ymd = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(dd.getDate()).padStart(2, "0")}`;
        return ymd === today;
      }).length;
      if (todayCount >= SNACK_DAILY_LIMIT) {
        Alert.alert("今日加餐已用完", "明天再来吧～", [
          { text: "好的", onPress: () => router.back() },
        ]);
        return;
      }
    }

    setPhase("uploading");
    setDetectError(null);
    setTopPreds([]);
    setRejectReason(null);

    let result;
    try {
      result = await detectFood(imageUri);
    } catch (e) {
      // 区分 abort/网络 vs 服务挂，给用户更有意义的话。严格模式：无论哪种都拒绝打卡。
      const raw = e instanceof Error ? e.message : String(e);
      const isAbort =
        (e as { name?: string } | null)?.name === "AbortError" ||
        raw.includes("aborted");
      const isNetwork = raw.includes("Network request failed");
      const friendly =
        isAbort || isNetwork
          ? "识别服务连不上，请检查网络后重拍"
          : raw.startsWith("detect 5")
            ? "识别服务暂时累了，等会儿再来"
            : "识别失败，请重拍";
      setDetectError(friendly);
      setRejectReason("network_fail");
      setPhase("rejected");
      return;
    }

    // backend Food-101 判定不是食物 → 拒绝（top-1 confidence < 0.15）
    if (!result.isFood || !result.foodLabel) {
      // TODO(v1.2.x): 连续 3 次 rejectCount → 弹「需要帮助?」link 到 FAQ 静态页。
      //   设计见 docs/v1.2.1-stage-0-easy-onboarding.md §6.3 / §14
      //   暂跳过实现,v1.2.x 后续 release 加 (modal)/help-faq.tsx
      setRejectReason("no_food");
      setPhase("rejected");
      return;
    }

    setTopPreds(result.topPredictions);
    const foodName = result.foodLabel; // 中文，已由后端翻译（具体名 或 "美食" 兜底）

    // detect 通过：开始正式打卡 +HP +dialogue
    // 重拍场景：本次 modal 已经打过卡，跳过 +HP 和 dialogue，只更新识别结果
    if (!confirmedOnce) {
      if (isSnack) {
        // 加餐流：addSnack 内部 push kind='snack_done' dialogue + HP +10
        // bodyOverride 用 detect 结果拼，foodLabel 喂 history 留 foodTags 痕迹（v1.1.2）
        const snackBody = `记下了这份 ${foodName} ✓`;
        addSnack({
          photoUri: imageUri ?? undefined,
          bodyOverride: snackBody,
          foodLabel: foodName,
        });
        setDoneLine(snackBody);
        setEncourageLine("");
      } else {
        markMealDone(realSlot, { photoUri: imageUri ?? undefined });

        // 动态文案：用 backend Food-101 中文 label 拼，让 mascot 看起来真在「看图」
        const doneBody = `太棒了！这份 ${foodName} 看起来不错`;
        const encourageBody = pickRandom(ENCOURAGE_LINES);

        pushDialogue({
          kind: "meal_done",
          body: doneBody,
          mealSlot: realSlot,
          hpDelta: HP_MEAL_PHOTO_GAIN,
          photoUri: imageUri ?? undefined,
          foodTags: [foodName],
        });
        pushDialogue({
          kind: "encourage",
          body: encourageBody,
          mealSlot: realSlot,
        });
        setDoneLine(doneBody);
        setEncourageLine(encourageBody);
      }
      setConfirmedOnce(true);

      // v1.2.1: Stage 0 那张照算今日 closestSlotByWallClock 的餐(markMealDone 已做),
      // 同时 advanceFromStage0 触发 Stage 0 → 0.5 transition + transitionsPending push
      // (在 markMealDone 之后调,确保 mealRecords / dialogueHistory 已落库)
      if (isStage0) {
        advanceFromStage0();
      }
    }

    setPhase("result");
    // v1.1 #14: 进 result 自动开庆祝弹窗（重拍场景也开 — 用户每次确认都看动画）
    setCelebrationOpen(true);
  };

  // 在 result / rejected 页点"重拍" → 回 intro，清掉本张图和识别结果，confirmedOnce 保留
  const onRetake = () => {
    setImageUri(null);
    setTopPreds([]);
    setDetectError(null);
    setRejectReason(null);
    setPhase("intro");
  };

  const onSelectFullness = (score: FullnessScore) => {
    setSelectedFullness(score);
    addFullnessRecord({ mealSlot: realSlot, score });
  };

  const onFinish = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-ink text-lg font-semibold">
            {isSnack ? "加餐 · 记录" : `${slotLabel[realSlot]} · 记录`}
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sub text-sm">关闭</Text>
          </Pressable>
        </View>

        {phase === "intro" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            <Text className="text-ink text-base text-center mb-6">
              拍一张你正在吃的或准备吃的就行，{"\n"}哪怕只是一杯牛奶。
            </Text>
            <Pressable
              onPress={() => pickImage("camera")}
              className="rounded-2xl py-4 px-8 bg-accent mb-3 w-full items-center"
            >
              <Text className="text-white font-semibold">拍一张</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage("library")}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder w-full items-center"
            >
              <Text className="text-ink font-semibold">从相册选</Text>
            </Pressable>
          </View>
        )}

        {phase === "preview" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 280, height: 280, borderRadius: 24 }}
                resizeMode="cover"
              />
            )}
            <Text className="text-sub text-sm mt-4 mb-6">看起来怎么样？</Text>
            <Pressable
              onPress={onConfirm}
              className="rounded-2xl py-4 px-8 bg-accent mb-3 w-full items-center"
            >
              <Text className="text-white font-semibold">确定</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage(lastSource)}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder w-full items-center"
            >
              <Text className="text-ink font-semibold">
                {lastSource === "camera" ? "重拍" : "重选"}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "uploading" && (
          <View className="items-center justify-center" style={{ minHeight: 480 }}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 220, height: 220, borderRadius: 24 }}
                resizeMode="cover"
              />
            )}
            <Text className="text-sub text-sm mt-6">上传中...</Text>
          </View>
        )}

        {phase === "rejected" && (
          <View className="items-center" style={{ paddingTop: 16, minHeight: 480 }}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 200, height: 200, borderRadius: 20, opacity: 0.6 }}
                resizeMode="cover"
              />
            )}
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-5 w-full">
              <Text className="text-ink text-base font-semibold mb-1">
                {rejectReason === "no_food"
                  ? isStage0
                    ? "再来一张吧"
                    : "看起来不像食物哦"
                  : isStage0
                    ? "网不太好"
                    : "识别服务连不上"}
              </Text>
              <Text className="text-sub text-sm leading-5">
                {rejectReason === "no_food"
                  ? isStage0
                    ? "这次让我看清楚是什么 ✨"
                    : "换个角度重拍一张？要让我能看清楚是什么食物 ✨"
                  : isStage0
                    ? "等会儿再来试一下吧"
                    : detectError ?? "请检查网络后重拍"}
              </Text>
            </View>

            <Pressable
              onPress={onRetake}
              className="rounded-2xl py-4 px-8 bg-accent mt-6 w-full items-center"
            >
              <Text className="text-white font-semibold">重拍一张</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder mt-3 w-full items-center"
            >
              <Text className="text-ink font-semibold">先回首页</Text>
            </Pressable>
          </View>
        )}

        {phase === "result" && (
          <View className="items-center" style={{ paddingTop: 16 }}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <View className="bg-ok/20 rounded-full px-6 py-3 mb-4">
                <Text className="text-ok text-base font-semibold">
                  血量 +{hpGain}
                </Text>
              </View>
            </Animated.View>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 160, height: 160, borderRadius: 20, opacity: 0.9 }}
                resizeMode="cover"
              />
            )}
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-5 w-full">
              <Text className="text-sub text-xs mb-2">{robotName}</Text>
              <Text className="text-ink text-base leading-6">{doneLine}</Text>
              {encourageLine && (
                <Text className="text-ink text-sm leading-5 mt-2 opacity-80">
                  {encourageLine}
                </Text>
              )}
            </View>

            {topPreds.length > 0 && (
              <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-3 w-full">
                <Text className="text-sub text-xs mb-2">识别到</Text>
                <View className="flex-row flex-wrap">
                  {topPreds.map((p, i) => (
                    <View
                      key={`${p.labelEn}-${i}`}
                      className="bg-bg rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-ink text-sm">
                        {p.label} · {Math.round(p.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 加餐流跳过饱腹度评分（snack 不算正餐，不影响"吃饱率"统计）*/}
            {!isSnack && (
              <>
                <Text className="text-ink text-sm font-semibold mt-6 self-start">
                  这餐吃得怎么样？
                </Text>
                <View className="w-full mt-2">
                  <FullnessRatingPicker
                    selectedScore={selectedFullness}
                    onSelect={onSelectFullness}
                  />
                </View>
              </>
            )}

            <Pressable
              onPress={onFinish}
              className="rounded-2xl py-4 px-8 bg-accent mt-6 w-full items-center"
            >
              <Text className="text-white font-semibold">
                {isSnack
                  ? "完成"
                  : selectedFullness === undefined
                  ? "跳过，先回首页"
                  : "完成"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onRetake}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder mt-3 w-full items-center"
            >
              <Text className="text-ink font-semibold">重拍一张</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* v1.1 #14 庆祝弹窗（doc §八）：进 result phase 自动开 */}
      <CelebrationModal
        visible={celebrationOpen && phase === "result"}
        hpDelta={hpGain}
        title="太棒了！"
        doneLine={doneLine || "记录成功"}
        onContinue={() => setCelebrationOpen(false)}
      />
    </SafeAreaView>
  );
}
