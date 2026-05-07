import { ScrollView, View, Image, Text } from "react-native";
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
        {/* 1. Hero：mascot card（mascot 右对齐 + 文字 overlay 左上）+ 心形 absolute 浮卡跨底 */}
        <View style={{ marginBottom: 32 /* 16 心形浮卡溢出 + 16 后续间距 */ }}>
          {/* mascot card：30 圆角 / overflow hidden / aspectRatio 524:461 */}
          <View
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.card,
              borderWidth: 1,
              borderRadius: 30,
              overflow: "hidden",
              aspectRatio: 524 / 461,
              position: "relative",
            }}
          >
            {/* mascot 右对齐 contain：右 anchor + 高度撑满 + width 由 aspect 推 */}
            <Image
              source={band.mascot}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                aspectRatio: band.mascotAspect,
              }}
              resizeMode="contain"
            />
            {/* 文字 overlay 左上 */}
            <View
              style={{
                position: "absolute",
                top: 28,
                left: 24,
                maxWidth: "55%",
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

          {/* 心形浮卡：absolute 跨 mascot 底沿（自带 bg + border） */}
          <View
            style={{
              position: "absolute",
              bottom: -16,
              left: 16,
              right: 16,
              backgroundColor: "#FDFCF6",
              borderColor: "#D2DEB9",
              borderWidth: 1,
              borderRadius: 30,
              paddingHorizontal: 16,
              paddingVertical: 14,
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
