import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";
import { colors } from "@src/theme/tokens";

// 各 stage home 顶部「💡 通关规则」可折叠卡 — xin 追加 v1.2.5。
//
// 设计意图:让用户了解当前关卡机制,但不抢主视觉。默认折叠成单行 chip,
// tap 展开看完整规则。pure encouragement 调性,无「失败/扣分/惩罚」字。
//
// 放在 HomeStageX 里的位置:StageChip 下方,Hero 上方(WeekStrip 之上,
// stage 1 例外有 WeekStrip 介于 StageChip + Hero 中间;那里也插在 StageChip 之下)。
//
// React Compiler 注意:Pressable 用 plain object style(见 memory)。

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type StageKey = 0 | 0.5 | 1 | 2 | 3 | 4 | 5;

const RULES: Record<StageKey, string> = {
  0:
    "拍 1 张餐照就能进入下一关。\n不限时间,什么时候拍都行。\n没有食物?用示例图也行。",
  0.5:
    "集齐 4 颗 ❤️ 就能进入第 1 阶段。\n每拍一张餐照 / 加餐照,+1 颗 ❤️。\n没拍的餐不会减分,完全鼓励。\n最快一天通关,慢慢来也没事。",
  1:
    "集齐 4 颗 ❤️(40 分)就能进入第 2 阶段。\n每餐(早午晚)拍照 +10 分。\n加餐拍照(每天最多 2 次)+10 分。\n没拍的餐不会减分。",
  2:
    "集齐 5 颗 ❤️(50 分)就能进入第 3 阶段。\n每餐拍照 +10 / 加餐 +10。\n本关解锁:体重记录 + 趋势图。",
  3:
    "集齐 3 颗 ❤️(30 分)就能进入第 4 阶段。\n每餐拍照 +10 / 加餐 +10。\n本关解锁:运动记录(开发中)。",
  4:
    "当前体重达到健康体重(BMI 21-22 × 身高²)时进入第 5 阶段。\n目标进度根据初始体重 → 目标体重计算。\n继续拍照吃饭,鼓励均衡饮食。",
  5:
    "在目标体重 ±2.5kg 范围内坚持 60 天,标记为「不朽印记」。\n每坚持 7 天 +1 ★。\n超出范围不会扣分,只是不加 ★。",
};

type Props = { stage: StageKey };

export default function StageRulesCard({ stage }: Props) {
  const [expanded, setExpanded] = useState(false);
  const body = RULES[stage];
  if (!body) return null;

  return (
    <Pressable
      onPress={() => {
        LayoutAnimation.configureNext(
          LayoutAnimation.Presets.easeInEaseOut
        );
        setExpanded((v) => !v);
      }}
      accessibilityRole="button"
      accessibilityLabel={`通关规则 ${expanded ? "已展开" : "已折叠"}`}
      style={{
        backgroundColor: "#FBF7EC",
        borderColor: "#E8E0D0",
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: "#7B7E80",
            fontWeight: "500",
          }}
        >
          💡 通关规则
        </Text>
        <Text style={{ fontSize: 12, color: "#A8A8A0" }}>
          {expanded ? "▲" : "▼"}
        </Text>
      </View>
      {expanded && (
        <Text
          style={{
            fontSize: 13,
            color: colors.ink.primary,
            lineHeight: 22,
            marginTop: 8,
          }}
        >
          {body}
        </Text>
      )}
    </Pressable>
  );
}
