import { View, Text } from "react-native";
import { hpBandFromValue, hpBandLabel } from "@src/data/dialogues";

type Props = { hp: number };

const bandColor = (band: ReturnType<typeof hpBandFromValue>) => {
  switch (band) {
    case "weak": return "bg-bad";
    case "hungry": return "bg-warn";
    case "recovering": return "bg-accent";
    case "happy": return "bg-ok";
  }
};

export default function HpBar({ hp }: Props) {
  const band = hpBandFromValue(hp);
  const pct = Math.max(0, Math.min(100, (hp / 15) * 100));
  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sub text-xs">HP {hp.toFixed(1)} / 15</Text>
        <Text className="text-ink text-xs font-medium">{hpBandLabel(band)}</Text>
      </View>
      <View className="h-3 w-full rounded-full bg-hpEmpty overflow-hidden">
        <View
          className={`h-full ${bandColor(band)}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
