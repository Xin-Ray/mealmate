import { useMemo } from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import { buildTodayFeed } from "@src/data/feed";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import FullnessRatingPicker from "@src/components/ui/FullnessRatingPicker";
import RecordCard from "@src/components/ui/RecordCard";
import { colors } from "@src/theme/tokens";
import type { FullnessScore } from "@src/types";

// 记录页（PRD §11.D）：
// - 顶部「我今天吃饭的饱腹感」3 选 1（默认 mealSlot=lunch，§11.K 第 7 项接 mealWindow）
// - 下方今日 feed（meal / fullness 当前可用，dialogue 待第 7 项）

const DEFAULT_FULLNESS_SLOT = "lunch" as const;

export default function RecordsScreen() {
  const todayKey = useStore((s) => s.todayKey);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const mealRecords = useStore((s) => s.mealRecords);
  const dialogueHistory = useStore((s) => s.dialogueHistory);
  const addFullnessRecord = useStore((s) => s.addFullnessRecord);

  // 今天该 slot 已选的 score（用于回填选中态）
  const todayFullnessForSlot = fullnessHistory.find(
    (r) => r.date === todayKey && r.mealSlot === DEFAULT_FULLNESS_SLOT
  );

  const feed = useMemo(
    () =>
      buildTodayFeed({
        todayKey,
        fullnessHistory,
        mealRecords,
        dialogueHistory,
      }),
    [todayKey, fullnessHistory, mealRecords, dialogueHistory]
  );

  const onSelectFullness = (score: FullnessScore) => {
    addFullnessRecord({ mealSlot: DEFAULT_FULLNESS_SLOT, score });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        <Text
          className="font-semibold mb-1"
          style={{ fontSize: 24, color: colors.ink.primary }}
        >
          记录
        </Text>

        {/* 1. 饱腹度评分 */}
        <Text
          className="font-semibold mt-5 mb-3"
          style={{ fontSize: 16, color: colors.ink.primary }}
        >
          我今天吃饭的饱腹感
        </Text>
        <FullnessRatingPicker
          selectedScore={todayFullnessForSlot?.score}
          onSelect={onSelectFullness}
        />

        {/* 2. 今日 feed */}
        <View className="mt-8 flex-row items-center justify-between mb-3">
          <Text
            className="font-semibold"
            style={{ fontSize: 20, color: colors.ink.primary }}
          >
            今日记录
          </Text>
        </View>

        {feed.length === 0 ? (
          <EmptyRecord />
        ) : (
          feed.map((item) => <RecordCard key={item.key} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
