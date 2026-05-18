// 阶段结束过渡屏（5 阶段共享）
//
// 视觉模板：Figma 100:5373（stage 1 end）
// v0.5 Plan B 重构：
//   - SafeAreaView + ScrollView flex:1 + position:absolute footer 三层布局
//   - 按钮永远在视口底部可见
//   - NextStepCard 视觉降级 —— 之前用饱和绿色 + 右箭头，被 xin 误以为按钮
//     现在改成浅米色 / 浅绿底 + ink 深色文字 + 无箭头 + 加"👇 完成本阶段后将进入"前缀
//     看起来明确是"预告说明"不是按钮
//
// 内容（从上到下）：
//   1. Hero：左 pill「阶段 N · 名称」+ 标题「阶段 N 完成」+ 副标 + 描述 / 右 emoji illustration
//   2. AccomplishmentsSection：3 项（绿勾 icon + 标题 + 描述）
//   3. NextStepCard：预告下一阶段（stage 5 无）—— 浅米色卡，非按钮
//   底部 sticky 按钮「完成」

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@src/theme/tokens";
import type { StageEndConfig } from "@src/data/stageTransitions";

type Props = {
  theme: StageEndConfig;
  onContinue: () => void;
};

const FOOTER_BTN_HEIGHT = 52;
const FOOTER_BUFFER = 24;

export default function StageEndScreen({ theme, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const footerBottomPadding = Math.max(insets.bottom, spacing.md);
  const scrollPaddingBottom =
    FOOTER_BTN_HEIGHT + footerBottomPadding + spacing.md + FOOTER_BUFFER;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.bg.page }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: scrollPaddingBottom,
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

        {/* 3. Next stage card —— 视觉降级（v0.5 Plan B bug3 fix）
            之前用饱和绿色 + 右箭头，被误以为按钮。
            现在改成浅米色 + ink 深色文字 + 无箭头 + "👇 完成本阶段后将进入" 前缀，
            明确是预告说明，不是按钮（避免和底部 sticky 按钮混淆） */}
        {theme.nextStage ? (
          <View
            style={{
              marginTop: spacing.xl,
              backgroundColor: "#F0F5E6", // 浅绿米（同 note banner 调，弱化）
              borderColor: "#D2DEB9",
              borderWidth: 1,
              borderRadius: radii.lg,
              padding: spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.ink.sub,
              }}
            >
              👇 完成本阶段后将进入
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: "700",
                color: colors.brand.greenDark,
              }}
            >
              阶段 {theme.nextStage.number} · {theme.nextStage.name}
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: colors.ink.primary,
                lineHeight: 18,
              }}
            >
              {theme.nextStage.description}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* sticky bottom 按钮 — 永远视口底部可见 */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: footerBottomPadding,
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
