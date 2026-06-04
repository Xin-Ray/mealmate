// 简化的过渡屏 (v1.2.1 Stage 0/0.5 用)
//
// 跟 StageStartScreen (stage 1) 比省略 stats / rules / note banner — Stage 0/0.5
// 是入门缓冲,不需要复杂数据展示。结构:
//   - 顶部小 chip(badge)
//   - 大 mascot
//   - 大标题
//   - 副标(可多行)
//   - 底部 sticky 大按钮
//
// Props:
//   badge — chip 显示文字,例如 "试一下" / "起步"
//   title — 大标题
//   subtitle — 副标(可包括 emoji)
//   ctaLabel — 按钮文字
//   onContinue — 按钮 onPress

import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@src/theme/tokens";

const MASCOT = require("../../../assets/mascot/full.png");

type Props = {
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onContinue: () => void;
};

export default function SimpleTransitionScreen({
  badge,
  title,
  subtitle,
  ctaLabel,
  onContinue,
}: Props) {
  const insets = useSafeAreaInsets();
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
          paddingBottom: 140,
          flexGrow: 1,
        }}
      >
        {/* chip */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FFEFD8",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: radii.pill,
            marginBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.brand.accentDark,
            }}
          >
            {badge}
          </Text>
        </View>

        {/* mascot 大居中 */}
        <View
          style={{
            alignItems: "center",
            marginVertical: spacing.lg,
          }}
        >
          <View style={{ width: "75%", aspectRatio: 524 / 461 }}>
            <Image
              source={MASCOT}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 大标题 */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: colors.brand.greenDark,
            lineHeight: 40,
            textAlign: "center",
          }}
        >
          {title}
        </Text>

        {/* 副标 */}
        <Text
          style={{
            marginTop: 14,
            fontSize: 16,
            color: colors.ink.sub,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          {subtitle}
        </Text>
      </ScrollView>

      {/* sticky footer */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.bg.page,
        }}
      >
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#5A8A5C" : colors.brand.greenDark,
            borderRadius: 30,
            paddingVertical: 18,
            alignItems: "center",
          })}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "600" }}>
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
