import { View, Text, Image, type ImageSourcePropType } from "react-native";
import { colors } from "@src/theme/tokens";
import type { FeedItem } from "@src/data/feed";
import type { MealSlot } from "@src/types";

// Home 专用记录行（按 Figma 12:144）
//
// 结构：左侧 mascot 头像（卡片**外**） + 右侧白卡内容。
// 与 records tab 的 <RecordCard> 区别：那个是单卡，mascot 在卡内左侧；
// 本组件 mascot 在卡片外，卡片右侧支持大食物图。
//
// kind 路由：
// - meal + photoUri / dialogue + photoUri → 文案 + 食物图 + HP delta + 时间
// - meal / dialogue 无 photo → 文案 + HP delta + 时间
// - fullness → emoji + 文案 + 时间（无 HP delta）

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

const HEAD_AVATAR = require("../../../assets/mascot/full.png");

const HpBadge = ({ delta }: { delta: number }) => (
  <View
    className="px-2 py-0.5 rounded-full self-start"
    style={{
      backgroundColor:
        delta > 0 ? `${colors.status.ok}33` : `${colors.status.bad}33`,
    }}
  >
    <Text
      className="text-xs font-semibold"
      style={{
        color: delta > 0 ? colors.status.ok : colors.status.bad,
      }}
    >
      血量{delta > 0 ? "+" : ""}
      {delta}
    </Text>
  </View>
);

type Props = {
  item: FeedItem;
  /** 自定义 mascot 头像（如 records tab 用 records.png）；缺省走 home 用的 full.png */
  mascotSource?: ImageSourcePropType;
};

export default function TodayRecordRow({ item, mascotSource }: Props) {
  // mascot 头像（卡外）
  const Avatar = (
    <Image
      source={mascotSource ?? HEAD_AVATAR}
      style={{ width: 60, height: 60 }}
      resizeMode="contain"
    />
  );

  if (item.kind === "fullness") {
    const r = item.record;
    return (
      <View className="flex-row items-center mb-3" style={{ gap: 10 }}>
        {Avatar}
        <View
          className="flex-1 px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: "#FCFCFC",
            borderColor: "#F4F3EC",
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center">
            <Text style={{ fontSize: 22 }}>{SCORE_EMOJI[r.score]}</Text>
            <Text
              className="ml-2 flex-1"
              style={{ fontSize: 14, color: colors.ink.primary }}
            >
              今日饱腹度：{r.score}/10 · {SLOT_LABEL[r.mealSlot]}
            </Text>
          </View>
          <Text className="text-sub text-xs mt-1">{fmtTime(item.ts)}</Text>
        </View>
      </View>
    );
  }

  // meal / dialogue 都接 photo / hpDelta / body 同款 row
  const photoUri =
    item.kind === "meal" ? item.record.photoUri : item.record.photoUri;
  const body =
    item.kind === "meal"
      ? item.record.status === "done"
        ? `${SLOT_LABEL[item.record.mealSlot]} 已完成 ✓`
        : `${SLOT_LABEL[item.record.mealSlot]} 错过了`
      : item.record.body;
  const hpDelta =
    item.kind === "meal"
      ? item.record.hpDelta
      : item.record.hpDelta;

  return (
    <View className="flex-row items-start mb-3" style={{ gap: 10 }}>
      {Avatar}
      <View
        className="flex-1 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FCFCFC",
          borderColor: "#F4F3EC",
          borderWidth: 1,
        }}
      >
        {photoUri ? (
          <View className="flex-row">
            <View className="flex-1 px-4 py-3 justify-between">
              <Text
                style={{ fontSize: 14, color: colors.ink.primary, lineHeight: 20 }}
                numberOfLines={3}
              >
                {body}
              </Text>
              <View className="mt-2">
                {hpDelta !== undefined && hpDelta !== 0 && (
                  <HpBadge delta={hpDelta} />
                )}
                <Text className="text-sub text-xs mt-1">{fmtTime(item.ts)}</Text>
              </View>
            </View>
            <Image
              source={{ uri: photoUri }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="px-4 py-3">
            <Text
              style={{ fontSize: 14, color: colors.ink.primary, lineHeight: 20 }}
            >
              {body}
            </Text>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sub text-xs">{fmtTime(item.ts)}</Text>
              {hpDelta !== undefined && hpDelta !== 0 && <HpBadge delta={hpDelta} />}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
