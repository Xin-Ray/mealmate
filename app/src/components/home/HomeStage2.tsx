import { ScrollView, View, Image, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import HpHeartsContent from "@src/components/ui/HpHeartsContent";
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
        {/* 1. Hero 卡：上半 mascot 全铺 + 文字 overlay；下半 心形条 */}
        <View
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.card,
            borderWidth: 1,
            borderRadius: 30,
            overflow: "hidden",
          }}
        >
          {/* 上半：mascot 铺满 + 文字 absolute overlay 在左上 */}
          <View
            style={{ position: "relative", aspectRatio: band.mascotAspect }}
          >
            <Image
              source={band.mascot}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                top: 22,
                left: 22,
                right: 180, // 给右侧 mascot 头部留空间
              }}
            >
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: "600",
                  color: "#3D683F",
                  lineHeight: 36,
                }}
              >
                {band.title}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: "#6E6F6C",
                  marginTop: 10,
                  lineHeight: 22,
                }}
              >
                {band.subtitle}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#666663",
                  marginTop: 4,
                  lineHeight: 20,
                }}
              >
                {band.hint}
              </Text>
            </View>
          </View>

          {/* 下半：心形条完整 3 段（按 Figma 22:3） */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 16,
            }}
          >
            <HpHeartsContent hp={hp} />
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
