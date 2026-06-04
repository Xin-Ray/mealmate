// Stage 0 主页 (v1.2.1) — 极简入门屏:中央 mascot + 一个大 CTA。
//
// 唯一通关条件:拍一张通过 Food-101 验证的餐照 → 自动跳 Stage 0.5。
// 这里不显示 HP / WeekStrip / 餐时段 / 体重 / 加餐(避免视觉负担)。
// 设计 doc: docs/v1.2.1-stage-0-easy-onboarding.md §7.1
//
// 文案是占位,xin 后续改。mascot 复用 stage 1 full.png(暂无 stage 0 专属资产)。

import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import StageChip from "@src/components/home/StageChip";
import { colors, spacing } from "@src/theme/tokens";

const MASCOT = require("../../../assets/mascot/full.png");

export default function HomeStage0() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <StageChip stage={0} />

        {/* Hero: 占视野上半区, mascot 大居中 + 文字下方 */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <View
            style={{
              width: "82%",
              aspectRatio: 524 / 461,
            }}
          >
            <Image
              source={MASCOT}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          <View style={{ alignItems: "center", paddingHorizontal: spacing.md }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: colors.brand.greenDark,
                lineHeight: 32,
                textAlign: "center",
              }}
            >
              先拍一张餐照试试吧
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontSize: 15,
                color: colors.ink.sub,
                lineHeight: 22,
                textAlign: "center",
              }}
            >
              不饿也没关系,就是让我看看
            </Text>
          </View>
        </View>

        {/* 底部大 CTA */}
        <Pressable
          onPress={() =>
            router.push("/(modal)/photo" as never)
          }
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#5A8A5C" : colors.brand.greenDark,
            borderRadius: 30,
            paddingVertical: 18,
            alignItems: "center",
          })}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 17,
              fontWeight: "600",
            }}
          >
            拍一张餐照
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
