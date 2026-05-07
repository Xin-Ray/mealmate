import { View, Text, Image } from "react-native";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";

// 单条记录卡（v0.4 §11.D 记录页 / HomeStage2 今日记录区用）
// TODO §11.K 第 7 项：dialogueHistory shape 升级（加 ts / hpDelta / photoUri）后接数据
//   目前是纯 UI 骨架，等数据流就绪。

type Props = {
  ts?: number;          // ms timestamp
  text: string;
  hpDelta?: number;     // 正绿负红
  photoUri?: string;    // 食物图缩略；无则显示 mascot mini
};

const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function RecordCard({ ts, text, hpDelta, photoUri }: Props) {
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: 48, height: 48, borderRadius: 12 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: colors.bg.hpEmpty,
            }}
          >
            <Text style={{ fontSize: 22 }}>🤖</Text>
          </View>
        )}
        <View className="flex-1">
          {ts !== undefined && (
            <Text className="text-sub text-xs">{fmtTime(ts)}</Text>
          )}
          <Text className="text-ink text-base mt-0.5" style={{ lineHeight: 22 }}>
            {text}
          </Text>
        </View>
        {hpDelta !== undefined && hpDelta !== 0 && (
          <View
            className="px-2 py-1 rounded-full"
            style={{
              backgroundColor:
                hpDelta > 0 ? `${colors.status.ok}33` : `${colors.status.bad}33`,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: hpDelta > 0 ? colors.status.ok : colors.status.bad,
              }}
            >
              血量{hpDelta > 0 ? "+" : ""}
              {hpDelta}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}
