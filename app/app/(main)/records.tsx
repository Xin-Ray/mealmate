import { useMemo } from "react";
import { SectionList, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import {
  buildAllFeed,
  sectionizeFeedByDate,
  formatSectionDate,
} from "@src/data/feed";
import EmptyRecord from "@src/components/ui/EmptyRecord";
import TodayRecordRow from "@src/components/ui/TodayRecordRow";
import { colors } from "@src/theme/tokens";

// 记录页（PRD §11.D v0.4 hotfix#13 重构）：
// - 标题"记录"（不是"今日记录"）
// - 删饱腹度 picker（饱腹度入口在 photo flow，不在此 tab）
// - 全部日期 SectionList，按日期 group header 分组
// - mascot 头像换 records.png（区别 home 用的 full.png）

const RECORDS_AVATAR = require("../../assets/mascot/records.png");

export default function RecordsScreen() {
  const todayKey = useStore((s) => s.todayKey);
  const fullnessHistory = useStore((s) => s.fullnessHistory);
  const mealRecords = useStore((s) => s.mealRecords);
  const dialogueHistory = useStore((s) => s.dialogueHistory);

  const sections = useMemo(() => {
    const all = buildAllFeed({ fullnessHistory, mealRecords, dialogueHistory });
    return sectionizeFeedByDate(all);
  }, [fullnessHistory, mealRecords, dialogueHistory]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
        ListHeaderComponent={
          <Text
            className="font-semibold mb-4"
            style={{ fontSize: 24, color: colors.ink.primary }}
          >
            记录
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              backgroundColor: colors.bg.page,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <Text
              className="font-semibold"
              style={{ fontSize: 14, color: colors.ink.sub }}
            >
              {formatSectionDate(section.date, todayKey)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TodayRecordRow item={item} mascotSource={RECORDS_AVATAR} />
        )}
        ListEmptyComponent={<EmptyRecord />}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}
