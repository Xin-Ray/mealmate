import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import StageChip from "@src/components/home/StageChip";
import SnackCard from "@src/components/ui/SnackCard";
import HeartProgress from "@src/components/ui/HeartProgress";
import WeekStrip from "@src/components/WeekStrip";
import { STAGE_TARGETS, useStore } from "@src/store/useStore";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// Stage 1 主页（v0.4 §11.C hotfix#13）：与 Stage 2 共用 hero 骨架。
// 差异：① 状态文案/mascot 走 stage 1 调性（getHpBand(hp, 1)），mascot 兜底 full.png
//       ② 不显示体重模块（stage 1 未解锁体重）
//       ③ 顶部多一行 WeekStrip 周视图（stage 1 特有）

export default function HomeStage1() {
  const router = useRouter();
  // v14 改动 #5: stage 1 用 stageScore 替代 hp 显示。band 仍用 stage 1 调性,
  // 但 hp 喂 getHpBand 的值改成 score/target 百分比映射(让 mascot text 跟着 score 涨)
  const stageScore = useStore((s) => s.stageScore);
  const todayMeals = useStore((s) => s.todayMeals);
  const todayKey = useStore((s) => s.todayKey);
  const mealHistory = useStore((s) => s.mealHistory);

  const target = STAGE_TARGETS[1];
  const pseudoHp = Math.round((stageScore / target) * 100);
  const band = getHpBand(pseudoHp, 1);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* r1 F6：stage label chip 统一 */}
        <StageChip stage={1} />
        {/* 1. 周视图（stage 1 特有） */}
        <WeekStrip
          todayKey={todayKey}
          todayMeals={todayMeals}
          history={mealHistory}
        />

        {/* 2. Hero：mascot card（mascot 右对齐 + 文字 overlay 左上）+ 心形 absolute 浮卡跨底 */}
        <View style={{ marginTop: 20, marginBottom: 32 /* 16 心形浮卡溢出 + 16 后续间距 */ }}>
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

          {/* v14 改动 #5: HpHeartsContent → HeartProgress(stage 1 = 4 颗心,target 40)*/}
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
