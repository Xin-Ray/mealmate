import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import HpHeartsCard from "@src/components/ui/HpHeartsCard";
import WeightCard from "@src/components/ui/WeightCard";
import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";

// Stage 2 主页（v0.4 §11.B）：状态区 / HP 心形 / 体重 / 倒计时 / 今日记录
// 本屏纯组装，所有 UI 模块抽到 src/components/ui/。

export default function HomeStage2() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const weightHistory = useStore((s) => s.weightHistory);

  const band = getHpBand(hp);
  const lastWeight = weightHistory[weightHistory.length - 1];
  const prevWeight =
    weightHistory.length >= 2 ? weightHistory[weightHistory.length - 2] : undefined;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 1. Hero 卡：整张 mascot 图（按 Figma，含 baked 标题/副标/装饰） */}
        <View
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.card,
            borderWidth: 1,
            borderRadius: 30,
            overflow: "hidden",
          }}
        >
          <Image
            source={band.mascot}
            style={{ width: "100%", aspectRatio: 524 / 461 }}
            resizeMode="contain"
          />
        </View>

        {/* 2. HP 心形条独立卡 */}
        <View style={{ marginTop: 16 }}>
          <HpHeartsCard hp={hp} />
        </View>

        {/* 2. 当前体重 */}
        <WeightCard
          lastWeight={lastWeight}
          prevWeight={prevWeight}
          onPress={() => router.push("/(modal)/weight-entry" as never)}
        />

        {/* 3. 提醒卡（active reminder / missed incomplete / 隐藏 三态） */}
        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        {/* 4. 今日记录 */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text
            className="font-semibold"
            style={{ fontSize: 20, color: colors.ink.primary }}
          >
            今日记录
          </Text>
          <Pressable onPress={() => router.push("/(main)/records" as never)}>
            <Text className="text-sub text-sm">查看更多 ›</Text>
          </Pressable>
        </View>

        {/* 完整 feed 在记录页；首页只显示空态或最近 N 条预览（第 7 项接） */}
        <View className="mt-3">
          <EmptyRecord />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
