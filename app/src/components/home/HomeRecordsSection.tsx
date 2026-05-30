import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import { buildTodayFeed } from "@src/data/feed";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import TodayRecordRow from "@src/components/ui/TodayRecordRow";
import { colors } from "@src/theme/tokens";

// 首页"今日记录"区（v0.4 hotfix #3）
//
// 数据源跟 records tab 同：buildTodayFeed selector 拼合 mealRecords +
// fullnessHistory + dialogueHistory。Home 只取最近 N 条预览。
// "查看更多 ›" → 跳记录 tab。

// r1 F11：xin 反馈 home 今日记录占太多空间，限 1 条（2026-05-30 由 3→1）
const HOME_PREVIEW_LIMIT = 1;

export default function HomeRecordsSection() {
  const router = useRouter();
  const todayKey = useStore((s) => s.todayKey);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const mealRecords = useStore((s) => s.mealRecords);
  const dialogueHistory = useStore((s) => s.dialogueHistory);

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

  const preview = feed.slice(0, HOME_PREVIEW_LIMIT);

  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className="font-semibold"
          style={{ fontSize: 18, color: "#54695E" }}
        >
          📝 今日记录
        </Text>
        <Pressable onPress={() => router.push("/(main)/records" as never)}>
          <Text style={{ fontSize: 13, color: "#A7A7A5" }}>查看更多 ›</Text>
        </Pressable>
      </View>

      {preview.length === 0 ? (
        <EmptyRecord />
      ) : (
        preview.map((item) => <TodayRecordRow key={item.key} item={item} />)
      )}
    </View>
  );
}
