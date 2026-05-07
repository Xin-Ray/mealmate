import { View, Text, Image } from "react-native";

// HP 心形条完整版（v0.4 hotfix #6，按 Figma 22:3 + 真 asset）
//
// 三段：
//   1) 9 颗心（Figma asset PNG，filled / empty 两态）
//   2) divider 横线（Figma asset PNG，4px 高拉伸）
//   3) 左 "还有 X 个爱心即可晋级下一个阶段" + 右 "X/100"
//
// 9 颗 / HP 100：1 颗 ≈ 11.11 HP，filled = round(hp * 9 / 100)。
// HP 0 → 0 / 47 → 4 / 80 → 7 / 100 → 9。
//
// xin 反馈 Figma 22:3 是 9 颗（不是 10）+ 用设计师画好的心形资源（不要 svg 自画）。

const HEART_FILLED = require("../../../assets/hearts/filled.png");
const HEART_EMPTY = require("../../../assets/hearts/empty.png");
const DIVIDER = require("../../../assets/hearts/divider.png");

const TOTAL_HEARTS = 9;

type Props = { hp: number };

export default function HpHeartsContent({ hp }: Props) {
  const clamped = Math.max(0, Math.min(100, hp));
  const filledCount = Math.round((clamped * TOTAL_HEARTS) / 100);
  const remaining = Math.max(0, TOTAL_HEARTS - filledCount);

  return (
    <View>
      {/* 1) 9 颗心 row */}
      <View className="flex-row items-center justify-between">
        {Array.from({ length: TOTAL_HEARTS }, (_, i) => (
          <Image
            key={i}
            source={i < filledCount ? HEART_FILLED : HEART_EMPTY}
            style={{ width: 28, height: 25 }}
            resizeMode="contain"
          />
        ))}
      </View>

      {/* 2) Figma divider 4px PNG，宽度自适应 */}
      <Image
        source={DIVIDER}
        style={{ width: "100%", height: 4, marginTop: 12, marginBottom: 10 }}
        resizeMode="stretch"
      />

      {/* 3) 左 hint + 右 hp/100 */}
      <View className="flex-row items-center justify-between">
        <Text style={{ fontSize: 12, color: "#747571", flex: 1, paddingRight: 12 }}>
          还有 {remaining} 个爱心即可晋级下一个阶段
        </Text>
        <Text style={{ fontSize: 18, fontWeight: "500", color: "#8FAE75" }}>
          {clamped}/100
        </Text>
      </View>
    </View>
  );
}
