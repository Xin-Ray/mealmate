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
import { detectFood, type Detection } from "@src/services/foodDetection";
import type { FullnessScore, MealSlot } from "@src/types";

type Phase = "intro" | "preview" | "uploading" | "result";

const slotLabel: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

// PRD §11.F.1：通过餐推送 2 条 dialogue（"太棒了！X 看起来不错" + 鼓励话）
const DONE_LINE_BY_SLOT: Record<MealSlot, string[]> = {
  breakfast: [
    "太棒了！早餐看起来不错",
    "今天的第一顿，开始得很好",
    "早餐光盘 ✓ 你今天的状态我看好",
  ],
  lunch: [
    "太棒了！午餐看起来不错",
    "中午这顿很到位",
    "午餐打卡，节奏稳",
  ],
  dinner: [
    "太棒了！晚餐看起来不错",
    "晚餐吃完，今天就圆满啦",
    "一天三顿都齐了，开心",
  ],
};

const ENCOURAGE_LINES = [
  "继续加油哈，这么下去一定可以尽快达到目标的",
  "保持节奏就很好，慢慢来",
  "你今天的努力我都看见了",
  "陪着你吃饭真开心",
  "这一份认真我先收下了",
];

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export default function PhotoScreen() {
  // issue #3 加餐：snack='true' 时走加餐流（addSnack 而非 markMealDone，
  // HP +10、不写 mealRecord、不需要 slot、跳过饱腹度选择）
  const { slot, snack } = useLocalSearchParams<{
    slot?: MealSlot;
    snack?: string;
  }>();
  const isSnack = snack === "true";
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";
  const hpGain = isSnack ? HP_SNACK_GAIN : HP_MEAL_PHOTO_GAIN;
  const router = useRouter();
  const markMealDone = useStore((s) => s.markMealDone);
  const addSnack = useStore((s) => s.addSnack);
  const robotName = useStore((s) => s.robotName);
  const pushDialogue = useStore((s) => s.pushDialogue);
  const addFullnessRecord = useStore((s) => s.addFullnessRecord);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const todayKey = useStore((s) => s.todayKey);

  const [phase, setPhase] = useState<Phase>("intro");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<Source>("camera");
  const [doneLine, setDoneLine] = useState<string>("");
  const [encourageLine, setEncourageLine] = useState<string>("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectError, setDetectError] = useState<string | null>(null);
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

  // preview → 用户点"确定" → uploading（真识别）→ result
  // §11.F.1：通过餐 +5 HP，push 两条 dialogue（done line + encourage line）
  // 识别成功/失败都进 result，失败不阻塞打卡（只在 UI 提示）
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
    setDetections([]);

    try {
      const resp = await detectFood(imageUri);
      setDetections(resp.detections);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDetectError(msg);
    }

    // 重拍场景：本次 modal 已经打过卡，跳过 +HP 和 dialogue，只更新识别结果
    if (!confirmedOnce) {
      if (isSnack) {
        // 加餐流：addSnack 内部 push kind='snack_done' dialogue + HP +10
        // 不写 mealRecord、不要 encourage 第二条、不需要 slot
        addSnack({ photoUri: imageUri ?? undefined });
        setDoneLine("加餐成功！随时拍照都算数～");
        setEncourageLine("");
      } else {
        markMealDone(realSlot, { photoUri: imageUri ?? undefined });

        const doneBody = pickRandom(DONE_LINE_BY_SLOT[realSlot]);
        const encourageBody = pickRandom(ENCOURAGE_LINES);

        pushDialogue({
          kind: "meal_done",
          body: doneBody,
          mealSlot: realSlot,
          hpDelta: HP_MEAL_PHOTO_GAIN,
          photoUri: imageUri ?? undefined,
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
    }

    setPhase("result");
    // v1.1 #14: 进 result 自动开庆祝弹窗（重拍场景也开 — 用户每次确认都看动画）
    setCelebrationOpen(true);
  };

  // 在 result 页点"重拍" → 回 intro，清掉本张图和识别结果，confirmedOnce 保留
  const onRetake = () => {
    setImageUri(null);
    setDetections([]);
    setDetectError(null);
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

            {detections.length > 0 && (
              <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-3 w-full">
                <Text className="text-sub text-xs mb-2">识别到</Text>
                <View className="flex-row flex-wrap">
                  {detections.map((d, i) => (
                    <View
                      key={`${d.label}-${i}`}
                      className="bg-bg rounded-full px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-ink text-sm">
                        {d.label} · {Math.round(d.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {detectError && detections.length === 0 && (
              <View className="bg-white border border-cardBorder rounded-2xl px-5 py-3 mt-3 w-full">
                <Text className="text-sub text-xs">
                  识别服务没连上，餐已打卡。{"\n"}({detectError})
                </Text>
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
