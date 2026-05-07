import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import Card from "@src/components/ui/Card";
import { hpHeartsFill } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";

// HP 心形条卡片（v0.4 hotfix：HomeStage2 hero 修正后通用版）
//
// 用 react-native-svg 画 10 颗心 path，按 hp band 切填充色（不再用 emoji ❤️/🤍）。
// 卡片包装 = <Card>（白米黄背景 + 浅绿边 + 16 圆角）。
//
// 视觉：
// - 满心：colors.brand.greenSoft (#8FAE75)
// - 空心：浅绿 #D8E0CA（轮廓更浅一档）
// - 简化：>= 50% 视为满心；半填先不画，v0.5 上线前打磨
//
// 用方：HomeStage1 / HomeStage2 共用。

const HEART_PATH =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const HEART_FILL = colors.brand.greenSoft;
const HEART_EMPTY = "#D8E0CA";

type Props = { hp: number };

export default function HpHeartsCard({ hp }: Props) {
  const fills = hpHeartsFill(hp);
  const clamped = Math.max(0, Math.min(100, hp));
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-1">
          {fills.map((f, i) => (
            <Svg key={i} width={20} height={18} viewBox="0 0 24 24">
              <Path
                d={HEART_PATH}
                fill={f >= 0.5 ? HEART_FILL : HEART_EMPTY}
              />
            </Svg>
          ))}
        </View>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.brand.green,
          }}
        >
          {clamped}/100
        </Text>
      </View>
    </Card>
  );
}
