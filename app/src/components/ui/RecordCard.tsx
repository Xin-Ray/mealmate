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
    const r = item.record;
    // failure 专属渲染（PRD §11.L）：暖橘 / 米色调，无 HP badge，不显示绿色 +X
    // 区别普通 dialogue —— 这是把 demote 事件留账的痕迹，不是常规对话。
    // snack_done 专属渲染（issue #3 v0.5+）：浅米黄 + 浅绿边 + 🍎 icon + HP +10 badge
    // 区别 meal kind：snack 不在 mealRecords，没有 done/missed status；
    // 也区别普通 dialogue：加餐是用户主动行为，应有"+X"反馈感
    if (r.kind === "snack_done") {
      return (
        <Card
          style={{
            marginBottom: 8,
            backgroundColor: "#FBFAF1",
            borderColor: "#E2E8CF",
          }}
        >
          <View className="flex-row items-start gap-3">
            {r.photoUri ? (
              <Image
                source={{ uri: r.photoUri }}
                style={{ width: 48, height: 48, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="items-center justify-center rounded-xl"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#F0F5E6",
                }}
              >
                <Text style={{ fontSize: 22 }}>🍎</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
              <Text
                className="mt-0.5"
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.brand.greenDark,
                  lineHeight: 22,
                }}
              >
                加餐
              </Text>
              <Text
                className="mt-0.5"
                style={{ fontSize: 13, color: colors.ink.sub, lineHeight: 18 }}
              >
                {r.body}
              </Text>
            </View>
            {r.hpDelta !== undefined && r.hpDelta !== 0 && (
              <View
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${colors.status.ok}33`,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.status.ok }}
                >
                  血量+{r.hpDelta}
                </Text>
              </View>
            )}
          </View>
        </Card>
      );
    }
    if (r.kind === "failure") {
      return (
        <Card
          style={{
            marginBottom: 8,
            backgroundColor: "#FFF7E8",
            borderColor: colors.brand.accent,
          }}
        >
          <View className="flex-row items-start gap-3">
            <View
              className="items-center justify-center rounded-xl"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#FFEFD8",
                borderWidth: 1,
                borderColor: colors.brand.accent,
              }}
            >
              <Text style={{ fontSize: 22 }}>💭</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
              <Text
                className="mt-0.5"
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.brand.accentDark,
                  lineHeight: 22,
                }}
              >
                {r.body}
              </Text>
              <Text
                className="mt-0.5"
                style={{ fontSize: 13, color: colors.ink.sub }}
              >
                HP 已重置到 90
              </Text>
            </View>
          </View>
        </Card>
      );
    }
    return (
      <Card style={{ marginBottom: 8 }}>
        <View className="flex-row items-start gap-3">
          {r.photoUri ? (
            <Image
              source={{ uri: r.photoUri }}
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
            <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
            <Text
              className="text-ink text-base mt-0.5"
              style={{ lineHeight: 22 }}
            >
              {r.body}
            </Text>
          </View>
          {r.hpDelta !== undefined && r.hpDelta !== 0 && (
            <View
              className="px-2 py-1 rounded-full"
              style={{
                backgroundColor:
                  r.hpDelta > 0
                    ? `${colors.status.ok}33`
                    : `${colors.status.bad}33`,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{
                  color: r.hpDelta > 0 ? colors.status.ok : colors.status.bad,
                }}
              >
                血量{r.hpDelta > 0 ? "+" : ""}
                {r.hpDelta}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  }

  if (item.kind === "meal") {
    const r = item.record;
    const isDone = r.status === "done";
    const text = isDone
      ? `${SLOT_LABEL[r.mealSlot]} 已完成 ✓`
      : `${SLOT_LABEL[r.mealSlot]} 错过了`;
    return (
      <Card style={{ marginBottom: 8 }}>
        <View className="flex-row items-start gap-3">
          {r.photoUri ? (
            <Image
              source={{ uri: r.photoUri }}
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
              <Text style={{ fontSize: 22 }}>{isDone ? "🍽️" : "💤"}</Text>
            </View>
          )}
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
                r.hpDelta > 0
                  ? `${colors.status.ok}33`
                  : `${colors.status.bad}33`,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{
                color: r.hpDelta > 0 ? colors.status.ok : colors.status.bad,
              }}
            >
              血量{r.hpDelta > 0 ? "+" : ""}
              {r.hpDelta}
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
