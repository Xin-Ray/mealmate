import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";
import HpHeartsCard from "@src/components/ui/HpHeartsCard";
import StatusTitle from "@src/components/ui/StatusTitle";
import HomeMealStatusSlot from "@src/components/home/HomeMealStatusSlot";
import HomeRecordsSection from "@src/components/home/HomeRecordsSection";
import WeekStrip from "@src/components/WeekStrip";
import { colors } from "@src/theme/tokens";

// Stage 1 主页（v0.4 §11.C）：与 Stage 2 共用 ui/ 组件库。
// 差异：① 状态文案用 stage 1 调性（getHpBand(hp, 1)），mascot 用 full.png 兜底
//       ② 不显示体重模块（stage 1 未解锁）
//       ③ 顶部多一行周视图（stage 1 特有）

export default function HomeStage1() {
  const hp = useStore((s) => s.hp);
  const todayMeals = useStore((s) => s.todayMeals);
  const todayKey = useStore((s) => s.todayKey);
  const mealHistory = useStore((s) => s.mealHistory);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg.page }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
        {/* 1. 周视图（stage 1 特有） */}
        <WeekStrip
          todayKey={todayKey}
          todayMeals={todayMeals}
          history={mealHistory}
        />

        {/* 2. 状态大标题 + Mascot（stage 1 调性） */}
        <View className="mt-5">
          <StatusTitle hp={hp} stage={1} />
        </View>

        {/* 3. HP 心形条 */}
        <View style={{ marginTop: 20 }}>
          <HpHeartsCard hp={hp} />
        </View>

        {/* 4. 提醒卡（active reminder / missed incomplete / 隐藏 三态） */}
        <View style={{ marginTop: 16 }}>
          <HomeMealStatusSlot />
        </View>

        {/* 5. 今日记录（与 records tab 同 selector，最近 3 条预览） */}
        <HomeRecordsSection />
      </ScrollView>
    </SafeAreaView>
  );
}
