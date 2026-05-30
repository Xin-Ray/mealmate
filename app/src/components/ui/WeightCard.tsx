import { View, Text } from "react-native";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";
import type { WeightRecord } from "@src/types";

// 当前体重模块（HomeStage2 用）：最近一次 + 与上次 diff + 时间。
// 整卡可点 → onPress 跳 weight-entry modal。
//
// r1 F9：xin 装机反馈 — 用户看不出能拍照（之前右侧只一个 ⚖️ 装饰 emoji）。
// 改成右侧显眼绿色圆头 📷 按钮（视觉上像可点 CTA），onPress 跟整卡一致都
// 跳 weight-entry modal（modal 内支持 Gemini Vision OCR 拍秤盘）。

type Props = {
  lastWeight?: WeightRecord;
  prevWeight?: WeightRecord;
  onPress: () => void;
};

const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mn}`;
};

export default function WeightCard({ lastWeight, prevWeight, onPress }: Props) {
  const weightDiff =
    lastWeight && prevWeight ? lastWeight.kg - prevWeight.kg : null;

  return (
    <Card onPress={onPress} style={{ marginTop: 16 }}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sub text-xs">当前体重</Text>
          {lastWeight ? (
            <>
              <Text
                className="font-semibold mt-1"
                style={{ fontSize: 32, color: colors.ink.primary }}
              >
                {lastWeight.kg.toFixed(1)} kg
              </Text>
              <Text className="text-sub text-xs mt-1">
                {prevWeight && weightDiff !== null
                  ? `对比上次 ${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(1)} kg · ${fmtTime(lastWeight.recordedAt)}`
                  : `首次记录 · ${fmtTime(lastWeight.recordedAt)}`}
              </Text>
            </>
          ) : (
            <Text
              className="mt-1"
              style={{ fontSize: 18, color: colors.ink.sub }}
            >
              还没有记录哦
            </Text>
          )}
        </View>
        {/* r1 F9: 显眼相机按钮（视觉 CTA，告诉用户能拍照）*/}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.brand.green,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>📷</Text>
        </View>
      </View>
    </Card>
  );
}
