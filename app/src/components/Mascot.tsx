import { View, Text } from "react-native";
import { hpBandFromValue } from "@src/data/dialogues";

type Props = { hp: number; size?: number };

// 占位机器人立绘：根据 HP band 用 emoji + 背景圆圈表达情绪
// 后续会替换成 Lottie / 真实立绘资源
const emojiByBand = (band: ReturnType<typeof hpBandFromValue>) => {
  switch (band) {
    case "weak": return "🥺";
    case "hungry": return "😋";
    case "recovering": return "🙂";
    case "happy": return "😊";
  }
};

const bgByBand = (band: ReturnType<typeof hpBandFromValue>) => {
  switch (band) {
    case "weak": return "bg-bad/20";
    case "hungry": return "bg-warn/20";
    case "recovering": return "bg-accent/20";
    case "happy": return "bg-ok/20";
  }
};

export default function Mascot({ hp, size = 140 }: Props) {
  const band = hpBandFromValue(hp);
  return (
    <View
      className={`items-center justify-center rounded-full ${bgByBand(band)}`}
      style={{ width: size, height: size }}
    >
      <Text style={{ fontSize: size * 0.55 }}>🤖</Text>
      <Text
        style={{ fontSize: size * 0.18, position: "absolute", bottom: 8, right: 8 }}
      >
        {emojiByBand(band)}
      </Text>
    </View>
  );
}
