// Stage 0.5 主页 (v1.2.1) — 沿用 Stage 1 模板 + 4 颗爱心 hero(替换 HP 心形浮卡)。
//
// 设计 doc: docs/v1.2.1-stage-0-easy-onboarding.md §7.2
// 差异 vs Stage 1:
//   ① hero 区:不放 HP 心形浮卡 + mascot 状态文字,改放 4 颗爱心进度
//   ② mascot 用 stage 1 full.png(stage 0.5 没专属 mascot,鼓励调)
//   ③ mascot 文字 overlay 用鼓励文案,不是 HP band 状态描述
//   ④ WeekStrip 漏餐 cell 不变红(WeekStrip 内部按 currentStage<=0.5 切灰)
//      —— 等 WeekStrip 改造,本期先用现有渲染,漏餐免疫由 markMealMissed 早 return 保证

import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import StageChip from "@src/components/home/StageChip";
import HeartProgress from "@src/components/ui/HeartProgress";
import SnackCard from "@src/components/ui/SnackCard";
import WeekStrip from "@src/components/WeekStrip";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const MASCOT = require("../../../assets/mascot/full.png");
const MASCOT_ASPECT = 524 / 461;

export default function HomeStage0_5() {
  const router = useRouter();
  const stage05Score = useStore((s) => s.stage05Score);
  const todayMeals = useStore((s) => s.todayMeals);
  const todayKey = useStore((s) => s.todayKey);
  const mealHistory = useStore((s) => s.mealHistory);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        <StageChip stage={0.5} />

        {/* WeekStrip(stage 1 也有,保持视觉一致) */}
        <WeekStrip
          todayKey={todayKey}
          todayMeals={todayMeals}
          history={mealHistory}
        />

        {/* Hero: mascot card + 4 颗爱心浮卡跨底 */}
        <View style={{ marginTop: 20, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.card,
              borderWidth: 1,
              borderRadius: 30,
              overflow: "hidden",
              aspectRatio: MASCOT_ASPECT,
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
                  aspectRatio: MASCOT_ASPECT,
                }}
              >
                <Image
                  source={MASCOT}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            </View>
            {/* 文字 overlay 左上 — 鼓励调,不是 HP 状态 */}
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
                  fontSize: 28,
                  fontWeight: "600",
                  color: "#3D683F",
                  lineHeight: 34,
                }}
              >
                慢慢来
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#6E6F6C",
                  marginTop: 10,
                  lineHeight: 21,
                }}
              >
                每一顿都算
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#666663",
                  marginTop: 4,
                  lineHeight: 20,
                }}
              >
                集齐 4 颗 ❤️ 就正式开始
              </Text>
            </View>
          </View>

          {/* 4 颗爱心浮卡 — 跨 mascot 底沿,替代 stage 1/2 的 HP 心形浮卡 */}
          <View
            style={{
              position: "absolute",
              bottom: -16,
              left: 16,
              right: 16,
            }}
          >
            <HeartProgress score={stage05Score} />
          </View>
        </View>

        {/* 提醒卡 — 漏餐显示但不扣分(markMealMissed 在 store 已 early return) */}
        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        {/* 加餐卡 — Stage 0.5 也支持加餐(+1 颗爱心), 日上限 SNACK_DAILY_LIMIT=2 */}
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

        {/* 今日记录 */}
        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
