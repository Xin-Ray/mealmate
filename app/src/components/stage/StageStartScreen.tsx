// 阶段开始过渡屏（5 阶段共享）
//
// 视觉模板：Figma 100:977（stage 1 start）
// 布局：ScrollView + 底部 sticky CTA。
//   1. Hero：左 pill + 标题 + 副标 + 描述 / 右 emoji illustration
//   2. Stats card（3 列：初始 HP / 通关分数 / 关键）
//   3. "本阶段重点" 区块 + 3 个 Rule cards（竖排，icon + 标题 + 描述）
//   4. Note banner（柔绿背景 + leaf icon + 文案）
//   5. 底部 sticky 主 CTA「开始阶段 N」

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@src/theme/tokens";
import type { StageStartConfig } from "@src/data/stageTransitions";

type Props = {
  theme: StageStartConfig;
  onStart: () => void;
};

export default function StageStartScreen({ theme, onStart }: Props) {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.bg.page }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl + 64 + spacing.lg, // 给 sticky CTA 留位
        }}
      >
        {/* 1. Hero */}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.bg.card,
                borderColor: colors.border.card,
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
                  color: colors.brand.greenDark,
                }}
              >
                {theme.badge}
              </Text>
            </View>
            <Text
              style={{
                marginTop: spacing.md,
                fontSize: 32,
                fontWeight: "700",
                color: colors.brand.greenDark,
                lineHeight: 38,
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
              backgroundColor: colors.bg.card,
              borderColor: colors.border.card,
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

        {/* 2. Stats card */}
        <View
          style={{
            marginTop: spacing.xl,
            backgroundColor: colors.bg.card,
            borderColor: colors.border.card,
            borderWidth: 1,
            borderRadius: radii.xl,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.md,
            flexDirection: "row",
          }}
        >
          {theme.stats.map((stat, i) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                alignItems: "center",
                paddingHorizontal: 6,
                borderLeftWidth: i === 0 ? 0 : 1,
                borderLeftColor: colors.border.card,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: colors.ink.muted,
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.brand.greenDark,
                }}
              >
                {stat.value}
              </Text>
              {stat.sub ? (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.ink.sub,
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  {stat.sub}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* 3. Rules */}
        <Text
          style={{
            marginTop: spacing.xl,
            fontSize: 18,
            fontWeight: "700",
            color: colors.ink.primary,
          }}
        >
          {theme.rulesTitle}
        </Text>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {theme.rules.map((rule) => (
            <View
              key={rule.title}
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
                  width: 40,
                  height: 40,
                  borderRadius: radii.md,
                  backgroundColor: colors.bg.pageDim,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Text style={{ fontSize: 22 }}>{rule.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.ink.primary,
                  }}
                >
                  {rule.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.ink.sub,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {rule.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 4. Note banner */}
        <View
          style={{
            marginTop: spacing.xl,
            backgroundColor: "#F0F5E6", // 柔绿（greenSoft 的更浅版本，避免覆盖 HpHeartsCard 色）
            borderColor: "#D2DEB9",
            borderWidth: 1,
            borderRadius: radii.lg,
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Text style={{ fontSize: 22, marginRight: spacing.md }}>
            {theme.noteBanner.icon}
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.brand.greenDark,
              lineHeight: 18,
            }}
          >
            {theme.noteBanner.text}
          </Text>
        </View>
      </ScrollView>

      {/* 5. Sticky bottom CTA */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl, // SafeAreaView edges 已含 bottom，这里再加视觉留白
          backgroundColor: colors.bg.page,
          borderTopColor: colors.border.card,
          borderTopWidth: 1,
        }}
      >
        <Pressable
          onPress={onStart}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#4d6b2f" : colors.brand.green,
            borderRadius: radii.pill,
            paddingVertical: 16,
            alignItems: "center",
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF" }}>
            {theme.ctaLabel}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
