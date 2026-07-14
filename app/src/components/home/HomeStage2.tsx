import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import StageChip from "@src/components/home/StageChip";
import StageRulesCard from "@src/components/home/StageRulesCard";
import WeekStripConnected from "@src/components/home/WeekStripConnected";
import HeartProgress from "@src/components/ui/HeartProgress";
import SnackCard from "@src/components/ui/SnackCard";
import WeightCard from "@src/components/ui/WeightCard";
import { STAGE_TARGETS, useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Stage 2 主页（v0.4 §11.B）：状态区 / HP 心形 / 体重 / 倒计时 / 今日记录
// 本屏纯组装，所有 UI 模块抽到 src/components/ui/。

export default function HomeStage2() {
  const router = useRouter();
  // v14 改动 #5: stage 2 用 stageScore 替代 hp 显示。band 仍用 stage 2 调性,
  // 但 hp 喂 getHpBand 改成 score/target 百分比映射
  const stageScore = useStore((s) => s.stageScore);
  const weightHistory = useStore((s) => s.weightHistory);

  const target = STAGE_TARGETS[2];
  const pseudoHp = Math.round((stageScore / target) * 100);
  const band = getHpBand(pseudoHp);
  const lastWeight = weightHistory[weightHistory.length - 1];
  const prevWeight =
    weightHistory.length >= 2 ? weightHistory[weightHistory.length - 2] : undefined;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* r1 F6：stage label chip 统一 */}
        <StageChip stage={2} />
        <StageRulesCard stage={2} />
        {/* r1 F5：周一到周日吃饭记录表（之前只 stage 1 有）*/}
        <WeekStripConnected />
        <View style={{ height: 16 }} />
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
            {/* mascot 缩到原始 90%：宽度 hero 90% + 右下贴底（hero 容器 aspectRatio 不动） */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                // bottom: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "100%",
                  aspectRatio: band.mascotAspect,
                  transform: [{ translateY: 0 }],
                }}
              >
                <Image
                  source={band.mascot}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
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

          {/* v14 改动 #5: HpHeartsContent → HeartProgress(stage 2 = 5 颗心,target 50)*/}
          <View
            style={{
              position: "absolute",
              bottom: -16,
              left: 16,
              right: 16,
            }}
          >
            <HeartProgress score={stageScore} total={target} />
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

        {/* 3.5 加餐卡（issue #3 v0.5+）：永远显示，随时记一笔 HP +10 */}
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

        {/* 4. 今日记录（与 records tab 同 selector，最近 3 条预览） */}
        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
