import { View, Text, Image } from "react-native";
import { getHpBand } from "@src/theme/hp";
import { colors } from "@src/theme/tokens";

// 顶部状态区：左侧大标题 + 副标 + hint，右侧 mascot Image。
// mascot / 文案随 HP band 自动切（HP_BANDS + STAGE1_BAND_COPY 单一真源）。
// stage 决定文案调性：stage=2 量化口吻；stage=1 鼓励口吻 + full.png 兜底 mascot。

type Props = { hp: number; stage?: 1 | 2 };

export default function StatusTitle({ hp, stage = 2 }: Props) {
  const band = getHpBand(hp, stage);
  return (
    <View className="flex-row items-start">
      <View className="flex-1 pr-3 pt-2">
        <Text
          className="font-semibold"
          style={{ fontSize: 36, color: colors.brand.greenDark, lineHeight: 44 }}
        >
          {band.title}
        </Text>
        <Text
          className="mt-2"
          style={{ fontSize: 16, color: colors.ink.sub, lineHeight: 22 }}
        >
          {band.subtitle}
        </Text>
        <Text
          style={{ fontSize: 16, color: colors.ink.sub, lineHeight: 22 }}
        >
          {band.hint}
        </Text>
      </View>
      <Image
        source={band.mascot}
        style={{ width: 130, height: 130 }}
        resizeMode="contain"
      />
    </View>
  );
}
