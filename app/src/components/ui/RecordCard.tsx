import { View, Text, Image } from "react-native";
import Card from "@src/components/ui/Card";
import { colors } from "@src/theme/tokens";
import type { FeedItem } from "@src/data/feed";
import type { MealSlot } from "@src/types";

// 单条记录卡 — 接 FeedItem 自动 polymorphic 渲染（PRD §11.D.2）
// 三种 kind：meal / fullness / dialogue
//
// dialogue kind 暂返 null（dialogueHistory shape 升级留 §11.K 第 7 项）。

type Props = { item: FeedItem };

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const fmtTime = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const SCORE_EMOJI: Record<3 | 5 | 8, string> = {
  3: "😞",
  5: "😐",
  8: "😊",
};

export default function RecordCard({ item }: Props) {
  if (item.kind === "dialogue") {
    // TODO §11.K 第 7 项：dialogueHistory shape 升级后实装
    return null;
  }

  if (item.kind === "meal") {
    const isDone = item.status === "done";
    const text = isDone
      ? `${SLOT_LABEL[item.slot]} 已完成 ✓`
      : `${SLOT_LABEL[item.slot]} 错过了`;
    const hpDelta = isDone ? 5 : -10; // §11.F.1 / §11.F.2 默认值；真实数据待第 7 项
    return (
      <Card style={{ marginBottom: 8 }}>
        <View className="flex-row items-start gap-3">
          <View
            className="items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              backgroundColor: colors.bg.hpEmpty,
            }}
          >
            <Text style={{ fontSize: 22 }}>{isDone ? "🍽️" : "💤"}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
            <Text
              className="text-ink text-base mt-0.5"
              style={{ lineHeight: 22 }}
            >
              {text}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{
              backgroundColor:
                hpDelta > 0
                  ? `${colors.status.ok}33`
                  : `${colors.status.bad}33`,
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
        </View>
      </Card>
    );
  }

  // fullness kind
  const { record } = item;
  return (
    <Card style={{ marginBottom: 8 }}>
      <View className="flex-row items-start gap-3">
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.card,
          }}
        >
          <Text style={{ fontSize: 22 }}>{SCORE_EMOJI[record.score]}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
          <Text
            className="text-ink text-base mt-0.5"
            style={{ lineHeight: 22 }}
          >
            今日饱腹度：{record.score}/10
            <Text className="text-sub text-xs"> · {SLOT_LABEL[record.mealSlot]}</Text>
          </Text>
        </View>
      </View>
    </Card>
  );
}
