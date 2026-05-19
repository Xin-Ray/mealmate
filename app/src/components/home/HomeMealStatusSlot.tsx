import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import { selectActiveReminderSlot } from "@src/store/selectors/reminder";
import { selectMakeUpEligibleSlot } from "@src/store/selectors/mealStars";
import MealReminderCard from "@src/components/ui/MealReminderCard";
import MealMakeUpCard from "@src/components/ui/MealMakeUpCard";
import NextMealCard from "@src/components/ui/NextMealCard";

// 首页第二板块容器
//
// 渲染规则（issue #3 v10 起，MealIncompleteCard 已弃用，用 MakeUpCard 替代）：
// 1. 当前在某 mealWindow 内 + 该 slot 今日未 done → <MealReminderCard>
// 2. 否则今日有 missed + 未 madeUp 的 slot → <MealMakeUpCard>（让用户补救拍照）
// 3. 否则 → <NextMealCard>（下一顿倒计时 + 3 颗星）
//
// 之前的 MealIncompleteCard（"我知道了"算了）已删 —— 改成 MakeUpCard
// 让用户有补救机会（HP +10 净变化 0）。

export default function HomeMealStatusSlot() {
  const router = useRouter();
  const mealSchedules = useStore((s) => s.mealSchedules);
  const mealRecords = useStore((s) => s.mealRecords);
  const todayKey = useStore((s) => s.todayKey);

  const active = selectActiveReminderSlot({
    mealSchedules,
    mealRecords,
    todayKey,
  });
  if (active) {
    return (
      <MealReminderCard
        slot={active.slot}
        windowEnd={active.windowEnd}
        onPressGoPhoto={() =>
          router.push({
            pathname: "/(modal)/photo",
            params: { slot: active.slot },
          } as never)
        }
      />
    );
  }

  // issue #3：missed + 未 madeUp 的 slot → 给补救机会
  const makeUpSlot = selectMakeUpEligibleSlot({ mealRecords, todayKey });
  if (makeUpSlot) {
    return (
      <MealMakeUpCard
        slot={makeUpSlot}
        onPressGoMakeUp={() =>
          router.push({
            pathname: "/(modal)/photo",
            params: { slot: makeUpSlot, makeup: "true" },
          } as never)
        }
      />
    );
  }

  return <NextMealCard />;
}
