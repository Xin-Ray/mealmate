import { View, Text } from "react-native";
import { hpBandFromValue } from "@src/data/dialogues";

type Props = { hp: number; stage?: 1 | 2; size?: number };

// 占位机器人立绘：HP band 决定表情/底色，stage 决定"成长"程度（边框/主体大小/徽章）。
// 后续会把主体 emoji 替换成 Lottie / 真实立绘资源，结构不变。
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

export default function Mascot({ hp, stage = 1, size = 140 }: Props) {
  const band = hpBandFromValue(hp);
  const isStage2 = stage === 2;
  const ringClass = isStage2 ? "border-2 border-warn" : "";
  const bodyScale = isStage2 ? 0.62 : 0.55;

  return (
    <View
      className={`items-center justify-center rounded-full ${bgByBand(band)} ${ringClass}`}
      style={{ width: size, height: size }}
    >
      <Text style={{ fontSize: size * bodyScale }}>🤖</Text>
      <Text
        style={{ fontSize: size * 0.18, position: "absolute", bottom: 8, right: 8 }}
      >
        {emojiByBand(band)}
      </Text>
      {isStage2 && (
        <Text
          style={{ fontSize: size * 0.18, position: "absolute", top: 8, left: 8 }}
        >
          ⚡
        </Text>
      )}
    </View>
  );
}
