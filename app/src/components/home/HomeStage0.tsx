// Stage 0 主页 (v1.2.1 + v1.2.2 P0 fix) — 极简入门屏:中央 mascot + 按钮。
//
// 唯一通关条件:拍一张通过 Food-101 验证的餐照 → 自动跳 Stage 0.5。
// 这里不显示 HP / WeekStrip / 餐时段 / 体重 / 加餐(避免视觉负担)。
// 设计 doc: docs/v1.2.1-stage-0-easy-onboarding.md §7.1
//
// v1.2.2 P0 fix:原版用 flex:1 Hero 把 CTA 挤到屏底 → 被 tab bar 整个遮
//   真机用户看不到任何按钮卡死。现在按钮放 mascot+文字下面跟着走,不再 bottom-aligned。
//
// 文案占位,xin 后续改。mascot 复用 stage 1 full.png(暂无 stage 0 专属)。

import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import StageChip from "@src/components/home/StageChip";
import { colors, spacing } from "@src/theme/tokens";

const MASCOT = require("../../../assets/mascot/full.png");

export default function HomeStage0() {
  const router = useRouter();

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.bg.page }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
        }}
      >
        <StageChip stage={0} />

        {/* Hero stack: mascot + 文字 + CTA 紧凑在一起,在屏幕上中段。
            NOT flex:1 → 不抢空间,按钮总在 mascot 下方可见。 */}
        <View
          style={{
            alignItems: "center",
            marginTop: 40,
          }}
        >
          {/* mascot:稍微缩到 72% 给文字 + 按钮留空间 */}
          <View
            style={{
              width: "72%",
              aspectRatio: 524 / 461,
            }}
          >
            <Image
              source={MASCOT}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          {/* 文字 block,mascot 下方紧贴 */}
          <View style={{ alignItems: "center", marginTop: 16 }}>
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
              不饿也没关系，就是让我看看
            </Text>
          </View>

          {/* CTA 紧跟文字下方,不依赖 flex 撑到底部 → 不会被 tab bar 遮 */}
          <Pressable
            onPress={() => router.push("/(modal)/photo" as never)}
            style={({ pressed }) => ({
              marginTop: 32,
              backgroundColor: pressed ? "#5A8A5C" : colors.brand.green,
              borderRadius: 30,
              paddingVertical: 18,
              paddingHorizontal: 48,
              minHeight: 56,
              alignItems: "center",
              justifyContent: "center",
              // 阴影增强按钮存在感
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
              elevation: 3,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              拍一张餐照
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
