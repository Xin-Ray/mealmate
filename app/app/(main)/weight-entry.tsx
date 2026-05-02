import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import { hpBandFromValue } from "@src/data/dialogues";
import { generateMascotLine } from "@src/services/mascotLlm";
import { pickImageWithFallback, type Source } from "@src/services/imagePicker";
import type { HpBand } from "@src/types";

type Phase = "intro" | "preview" | "uploading" | "result";

// 体重模块自带的简单文案池（按 HP band），不动 dialogues.ts 的类型
const WEIGHT_LINES: Record<HpBand, string[]> = {
  weak: [
    "记下来啦，慢慢来，别给自己压力。",
    "今天能称就是好事，剩下的我们慢慢调。",
  ],
  hungry: [
    "数字记下了，节奏就是这样一点点稳的。",
    "吃饭和称重都到位，今天就够了。",
  ],
  recovering: [
    "在变好哦～继续保持。",
    "看得出你最近用心，我也跟着开心。",
  ],
  happy: [
    "状态超好！这个数字看着踏实。",
    "今天又是元气满满的一天，干杯！",
  ],
};

const pickWeightLine = (band: HpBand): string => {
  const pool = WEIGHT_LINES[band];
  return pool[Math.floor(Math.random() * pool.length)];
};

export default function WeightEntryScreen() {
  const router = useRouter();
  const skipPhoto = useStore((s) => s.skipWeightPhoto);
  const robotName = useStore((s) => s.robotName);
  const addWeightRecord = useStore((s) => s.addWeightRecord);

  // 跳过照片开关：直接进 preview（实际是纯数字输入屏）
  const [phase, setPhase] = useState<Phase>(skipPhoto ? "preview" : "intro");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<Source>("camera");
  const [kgInput, setKgInput] = useState<string>("");
  const [line, setLine] = useState<string>("");

  // HP +0.5 弹跳
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

  // 数字合法性
  const kgNum = parseFloat(kgInput);
  const kgValid = !isNaN(kgNum) && kgNum >= 20 && kgNum <= 250;
  const photoReady = skipPhoto || imageUri !== null;
  const canConfirm = kgValid && photoReady;

  const onConfirm = () => {
    if (!canConfirm) return;
    setPhase("uploading");
    setTimeout(() => {
      addWeightRecord({
        kg: Math.round(kgNum * 10) / 10, // 精度 0.1
        photoUri: imageUri ?? "",
      });

      // PRD §4.2：每日称重已上传 → HP +0.5。借用 markMealDone 的语义不太合适，
      // 直接用一个临时方案——给每日称重也加 0.5 HP，但通过 store 的 hp setter 间接做
      // （TODO: store 里加 markWeightLogged() 专用 action，这里先用最小改动）
      const before = useStore.getState().hp;
      useStore.getState().__dev_setHp(before + 0.5);

      const stage = useStore.getState().currentStage;
      const afterHp = useStore.getState().hp;
      const band = hpBandFromValue(afterHp);

      // 先用本地池兜底
      setLine(pickWeightLine(band));
      setPhase("result");

      // LLM 升级（如果开关开 + 有 key）
      generateMascotLine({
        stage,
        hp: afterHp,
        band,
        robotName: useStore.getState().robotName,
        recentAction: "meal_done", // 体重打卡也复用 meal_done 语义（积极行为）
      }).then((llm) => {
        if (llm) setLine(llm);
      });
    }, 500);
  };

  const onRetry = () => {
    if (skipPhoto) {
      // 跳过照片模式没有"重拍"概念，让用户重新输入数字即可——清空输入
      setKgInput("");
    } else {
      pickImage(lastSource);
    }
  };

  // 离开时若用户没确认 → 警告（避免误关丢数据）
  const onClose = () => {
    if (phase === "uploading" || phase === "result") {
      router.back();
      return;
    }
    if (kgInput || imageUri) {
      Alert.alert("还没保存", "现在退出会丢掉这次的体重记录。", [
        { text: "继续记录", style: "cancel" },
        {
          text: "丢弃并退出",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 pt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-ink text-lg font-semibold">体重 · 记录</Text>
          <Pressable onPress={onClose}>
            <Text className="text-sub text-sm">关闭</Text>
          </Pressable>
        </View>

        {phase === "intro" && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-ink text-base text-center mb-6">
              拍一张体重秤的照片，{"\n"}就在你站上去那一瞬。
            </Text>
            <Pressable
              onPress={() => pickImage("camera")}
              className="rounded-2xl py-4 px-8 bg-accent mb-3 w-full items-center"
            >
              <Text className="text-white font-semibold">拍体重秤</Text>
            </Pressable>
            <Pressable
              onPress={() => pickImage("library")}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder w-full items-center"
            >
              <Text className="text-ink font-semibold">从相册选</Text>
            </Pressable>
            <Text className="text-sub text-xs mt-6 text-center">
              如果不方便拍，可以在设置里打开"称重跳过照片"开关。
            </Text>
          </View>
        )}

        {phase === "preview" && (
          <View className="flex-1 items-center justify-center">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={{ width: 220, height: 220, borderRadius: 24 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="bg-white border border-cardBorder rounded-2xl items-center justify-center"
                style={{ width: 220, height: 120 }}
              >
                <Text className="text-sub text-sm">未拍照（已在设置里跳过）</Text>
              </View>
            )}

            <Text className="text-sub text-xs mt-6 mb-2">体重（kg）</Text>
            <TextInput
              value={kgInput}
              onChangeText={setKgInput}
              keyboardType="decimal-pad"
              placeholder="例如 60.5"
              className="bg-white border border-cardBorder rounded-2xl px-5 py-3 text-ink text-2xl font-semibold w-40 text-center"
              maxLength={6}
              autoFocus={skipPhoto || imageUri !== null}
            />
            {kgInput.length > 0 && !kgValid && (
              <Text className="text-bad text-xs mt-2">请输入 20–250 之间的数字</Text>
            )}

            <Pressable
              onPress={onConfirm}
              disabled={!canConfirm}
              className={`rounded-2xl py-4 px-8 mt-8 w-full items-center ${
                canConfirm ? "bg-accent" : "bg-hpEmpty"
              }`}
            >
              <Text
                className={`font-semibold ${canConfirm ? "text-white" : "text-sub"}`}
              >
                确定
              </Text>
            </Pressable>
            <Pressable
              onPress={onRetry}
              className="rounded-2xl py-4 px-8 bg-white border border-cardBorder mt-3 w-full items-center"
            >
              <Text className="text-ink font-semibold">
                {skipPhoto
                  ? "清空重填"
                  : lastSource === "camera"
                    ? "重拍"
                    : "重选"}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "uploading" && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sub text-sm">保存中...</Text>
          </View>
        )}

        {phase === "result" && (
          <View className="flex-1 items-center justify-center">
            <Animated.View style={{ transform: [{ scale }] }}>
              <View className="bg-ok/20 rounded-full px-6 py-3 mb-4">
                <Text className="text-ok text-base font-semibold">HP +0.5</Text>
              </View>
            </Animated.View>
            <Text className="text-ink text-3xl font-semibold">
              {kgInput} kg
            </Text>
            <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mt-6 w-full">
              <Text className="text-sub text-xs mb-2">{robotName}</Text>
              <Text className="text-ink text-base leading-6">{line}</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="rounded-2xl py-4 px-8 bg-accent mt-8 w-full items-center"
            >
              <Text className="text-white font-semibold">完成</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
