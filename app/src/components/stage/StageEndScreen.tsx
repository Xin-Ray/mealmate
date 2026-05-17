// 阶段结束过渡屏（5 阶段共享）
//
// 视觉模板：Figma 100:5373（stage 1 end）
// 布局：ScrollView + 底部 sticky CTA。
//   1. Hero：左 pill「阶段 N · 名称」+ 标题「阶段 N 完成」+ 副标 + 描述 / 右 emoji illustration
//   2. AccomplishmentsSection：3 项（绿勾 icon + 标题 + 描述）
//   3. NextStepCard：荧光绿底「下一阶段：XXX」+ 简介 + arrow（stage 5 无）
//   4. 底部 sticky 主 CTA「开始阶段 N+1」/ 末阶段「完成旅程」

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@src/theme/tokens";
import type { StageEndConfig } from "@src/data/stageTransitions";

type Props = {
  theme: StageEndConfig;
  onContinue: () => void;
};

export default function StageEndScreen({ theme, onContinue }: Props) {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.bg.page }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl + 64 + spacing.lg,
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

        {/* 2. Accomplishments */}
        <Text
          style={{
            marginTop: spacing.xl,
            fontSize: 18,
            fontWeight: "700",
            color: colors.ink.primary,
          }}
        >
          {theme.accomplishmentsTitle}
        </Text>
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          {theme.accomplishments.map((item) => (
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
                  backgroundColor: colors.brand.greenSoft,
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

        {/* 3. Next stage card */}
        {theme.nextStage ? (
          <View
            style={{
              marginTop: spacing.xl,
              backgroundColor: colors.brand.greenSoft,
              borderRadius: radii.lg,
              padding: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  opacity: 0.85,
                }}
              >
                下一阶段
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                阶段 {theme.nextStage.number} · {theme.nextStage.name}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#FFFFFF",
                  lineHeight: 18,
                  opacity: 0.92,
                }}
              >
                {theme.nextStage.description}
              </Text>
            </View>
            <Text style={{ fontSize: 28, color: "#FFFFFF", marginLeft: spacing.md }}>
              →
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* 4. Sticky bottom CTA */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          backgroundColor: colors.bg.page,
          borderTopColor: colors.border.card,
          borderTopWidth: 1,
        }}
      >
        <Pressable
          onPress={onContinue}
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
