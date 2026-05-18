// 阶段降级过渡屏（5 阶段共享）
//
// 触发：HP 降到 < 0 时由 store 的 demoteStage 推 transitionsPending → (main)/_layout
// consumer 切到此屏。
//
// 视觉与 StageStartScreen / StageEndScreen 区分：
//   - 强调"重整 / 鼓励"调性，避免任何负面用词
//   - 主色用橘黄 brand.accent（区别 end 的绿色 CTA）—— 但按钮仍然是 brand.green
//     保持品牌一致（橘色只用在 badge / icon circle / 装饰）
//   - illustration 用 🌧️ 占位
//   - 没有 nextStage 卡，没有 stats 卡 —— 只有 hero + encouragements + 按钮
//
// v0.5 Plan B 重构：
//   - SafeAreaView + ScrollView flex:1 + position:absolute footer 三层布局
//   - 按钮永远在视口底部可见
//   - 通过 useSafeAreaInsets 兜底 home indicator

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@src/theme/tokens";
import type { StageDemoteConfig } from "@src/data/stageTransitions";

type Props = {
  theme: StageDemoteConfig;
  onContinue: () => void;
};

export default function StageDemoteScreen({ theme, onContinue }: Props) {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.bg.page }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* 1. Hero（橘色 badge 区分 end 屏的绿色） */}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#FFEFD8",
                borderColor: colors.brand.accent,
                borderWidth: 1,
                borderRadius: radii.pill,
                paddingHorizontal: spacing.md,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.brand.accentDark,
                }}
              >
                {theme.badge}
              </Text>
            </View>
            <Text
              style={{
                marginTop: spacing.md,
                fontSize: 28,
                fontWeight: "700",
                color: colors.brand.accentDark,
                lineHeight: 34,
              }}
            >
              {theme.title}
            </Text>
            <Text
              style={{
                marginTop: spacing.xs,
                fontSize: 16,
                color: colors.ink.sub,
                lineHeight: 22,
              }}
            >
              {theme.subtitle}
            </Text>
          </View>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: radii.lg,
              backgroundColor: "#FFEFD8",
              borderColor: colors.brand.accent,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 56 }}>{theme.illustration}</Text>
          </View>
        </View>

        {/* divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.border.card,
            marginVertical: spacing.lg,
          }}
        />

        <Text
          style={{
            fontSize: 15,
            color: colors.ink.primary,
            lineHeight: 22,
          }}
        >
          {theme.description}
        </Text>

        {/* 2. Encouragements */}
        <Text
          style={{
            marginTop: spacing.xl,
            fontSize: 18,
            fontWeight: "700",
            color: colors.ink.primary,
          }}
        >
          {theme.encouragementTitle}
        </Text>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {theme.encouragements.map((item) => (
            <View
              key={item.title}
              style={{
                backgroundColor: colors.bg.card,
                borderColor: colors.border.card,
                borderWidth: 1,
                borderRadius: radii.lg,
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.pill,
                  backgroundColor: colors.brand.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {item.icon}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.ink.primary,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.ink.sub,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* sticky bottom 按钮（保持品牌绿 - 一致性优先） */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          backgroundColor: colors.bg.page,
          borderTopColor: colors.border.card,
          borderTopWidth: 1,
        }}
      >
        {/* static style 替代 function-form */}
        <Pressable
          onPress={onContinue}
          style={{
            backgroundColor: "#60883b",
            borderRadius: 999,
            paddingVertical: 16,
            width: "100%",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            {theme.ctaLabel}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
