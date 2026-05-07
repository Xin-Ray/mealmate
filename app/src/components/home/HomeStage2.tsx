import { ScrollView, View, Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import HpHeartsCard from "@src/components/ui/HpHeartsCard";
import WeightCard from "@src/components/ui/WeightCard";
import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
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
        {/* 1. Hero 卡：上半截左文右图 + 下半截心形条（同一 card） */}
        <View
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.card,
            borderWidth: 1,
            borderRadius: 30,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 20,
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "600",
                  color: "#3D683F",
                  lineHeight: 34,
                }}
              >
                {band.title}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#6E6F6C",
                  marginTop: 8,
                  lineHeight: 22,
                }}
              >
                {band.subtitle}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666663",
                  marginTop: 4,
                  lineHeight: 20,
                }}
              >
                {band.hint}
              </Text>
            </View>
            <Image
              source={band.mascot}
              style={{ width: 160, aspectRatio: band.mascotAspect }}
              resizeMode="contain"
            />
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#E8EFD9",
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <HpHeartsCard hp={hp} embedded />
          </View>
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

        {/* 4. 今日记录（与 records tab 同 selector，最近 3 条预览） */}
        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
