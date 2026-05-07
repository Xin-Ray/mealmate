import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { hpHeartsFill } from "@src/theme/hp";

// HP 心形条完整版（v0.4 hotfix #5，按 Figma 22:3）
//
// 三段：
//   1) 10 颗大心形（绿色）
//   2) 4px 浅色分隔横线
//   3) 左 "还有 X 个爱心即可晋级下一个阶段" + 右 "X/100"
//
// 用方：HomeStage2 hero card 下半截直接 inline（无外层 Card）。
// HomeStage1 仍用 <HpHeartsCard>（简洁版，心形 + X/100，无 hint 行）。

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const HEART_FILL = "#8FAE75";
const HEART_EMPTY = "#D8E0CA";

type Props = { hp: number };

export default function HpHeartsContent({ hp }: Props) {
  const fills = hpHeartsFill(hp);
  const clamped = Math.max(0, Math.min(100, hp));
  const remainingHearts = Math.max(0, Math.ceil((100 - clamped) / 10));

  return (
    <View>
      {/* 1) 10 颗大心，row 均匀分布 */}
      <View className="flex-row items-center justify-between">
        {fills.map((f, i) => (
          <Svg key={i} width={26} height={24} viewBox="0 0 24 24">
            <Path d={HEART_PATH} fill={f >= 0.5 ? HEART_FILL : HEART_EMPTY} />
          </Svg>
        ))}
      </View>

      {/* 2) 4px 分隔线 */}
      <View
        style={{
          height: 4,
          backgroundColor: "#E8EFD9",
          marginTop: 12,
          marginBottom: 10,
          borderRadius: 2,
        }}
      />

      {/* 3) 左 hint + 右 hp/100 */}
      <View className="flex-row items-center justify-between">
        <Text style={{ fontSize: 12, color: "#747571", flex: 1, paddingRight: 12 }}>
          还有 {remainingHearts} 个爱心即可晋级下一个阶段
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "500",
            color: "#8FAE75",
          }}
        >
          {clamped}/100
        </Text>
      </View>
    </View>
  );
}
