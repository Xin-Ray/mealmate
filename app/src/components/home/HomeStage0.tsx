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
import StageRulesCard from "@src/components/home/StageRulesCard";
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
        <StageRulesCard stage={0} />

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

          {/* CTA 紧跟文字下方,不依赖 flex 撑到底部 → 不会被 tab bar 遮。
              v1.2.2 P0 fix:Pressable 用 plain object style 而不是函数式 style,
              React Compiler 似乎 eat 了 ({pressed}) => ({...}) 形式让 bg 丢失。 */}
          <Pressable
            onPress={() => router.push("/(modal)/photo" as never)}
            style={{
              marginTop: 32,
              alignSelf: "stretch",
              backgroundColor: "#60883b",
              borderRadius: 30,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 56,
            }}
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

          {/* v1.2.3 兜底:身边没真食物 → 用 bundled 示例图走 Food-101 流程,
              一样会通过 + advance Stage 0.5。下方 subtle link,不抢主 CTA 视觉 */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(modal)/photo",
                params: { sample: "1" },
              } as never)
            }
            style={{
              marginTop: 14,
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                color: colors.ink.sub,
                fontSize: 14,
                textDecorationLine: "underline",
              }}
            >
              身边没食物?用示例图试试 →
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
