import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import HpHeartsContent from "@src/components/ui/HpHeartsContent";
import SnackCard from "@src/components/ui/SnackCard";
import WeightCard from "@src/components/ui/WeightCard";
import { useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Stage 3 主页（v1.1）：xin 拍板"基本上跟 stage 2 一样，但 hero 文案 + mascot
// 反映「现在重点是增重」"。所以骨架完全沿用 HomeStage2，只:
// 1) 顶部加一行 stage 3 标签「健康增重 v1」（暖橘色 badge），
// 2) hero 标题/副标可以由 band.title 透出（band 不变 → 保留情绪驱动文案）。
//
// TODO（doc §十二 risk 1）：等 xin 给 stage 3 专属 mascot 资源再换 band.mascot。

export default function HomeStage3() {
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
        {/* Stage 3 标签（暖橘色 chip） */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FFEFD8",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          <Text
            style={{ fontSize: 12, color: colors.brand.accentDark, fontWeight: "600" }}
          >
            阶段 3 · 健康增重 v1
          </Text>
        </View>

        {/* Hero：mascot card（沿用 stage 2 几何） */}
        <View style={{ marginBottom: 32 }}>
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
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "100%",
                  aspectRatio: band.mascotAspect,
                }}
              >
                <Image
                  source={band.mascot}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            </View>
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
                稳步增重，每天都比昨天好一点
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

          {/* HP 心形浮卡 */}
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

        {/* 体重 / 提醒 / 加餐 / 今日记录 — 与 stage 2 一致 */}
        <WeightCard
          lastWeight={lastWeight}
          prevWeight={prevWeight}
          onPress={() => router.push("/(modal)/weight-entry" as never)}
        />

        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        <View style={{ marginTop: 12 }}>
          <SnackCard
            onPress={() =>
              router.push({
                pathname: "/(modal)/photo",
                params: { snack: "true" },
              } as never)
            }
          />
        </View>

        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
