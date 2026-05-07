import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import {
  selectActiveReminderSlot,
  selectUnackMissedSlot,
} from "@src/store/selectors/reminder";
import MealReminderCard from "@src/components/ui/MealReminderCard";
import MealIncompleteCard from "@src/components/ui/MealIncompleteCard";

// 首页第二板块容器（v0.4 hotfix）
//
// 渲染规则（参考 §11.F + Figma 12:119 / 10:116）：
// 1. 当前在某 mealWindow 内 + 该 slot 今日未 done → <MealReminderCard>
// 2. 否则有未 ack 的 missed slot → <MealIncompleteCard>
// 3. 否则 null（首页不占位）

export default function HomeMealStatusSlot() {
  const router = useRouter();
  const mealSchedules = useStore((s) => s.mealSchedules);
  const mealRecords = useStore((s) => s.mealRecords);
  const todayKey = useStore((s) => s.todayKey);
  const acknowledgeMissedMeal = useStore((s) => s.acknowledgeMissedMeal);

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

  const missed = selectUnackMissedSlot({ mealRecords });
  if (missed) {
    return (
      <MealIncompleteCard
        slot={missed.slot}
        onAcknowledge={() => acknowledgeMissedMeal(missed.slot, missed.date)}
      />
    );
  }

  return null;
}
