import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useStore } from "@src/store/useStore";
import {
  selectActiveReminderSlot,
  selectUnackMissedSlot,
} from "@src/store/selectors/reminder";
import MealReminderCard from "@src/components/ui/MealReminderCard";
import MealIncompleteCard from "@src/components/ui/MealIncompleteCard";
import NextMealCard from "@src/components/ui/NextMealCard";

// 首页第二板块容器
//
// 渲染规则（参考 §11.F + Figma 12:119 / 10:116）：
// 1. 当前在某 mealWindow 内 + 该 slot 今日未 done → <MealReminderCard>
// 2. 否则有未 ack 的 missed slot → <MealIncompleteCard>
// 3. 否则 → <NextMealCard>（v0.5 加：显示下一顿倒计时 + 今日三餐进度星，
//    替代之前的 null 隐藏分支）

export default function HomeMealStatusSlot() {
  const router = useRouter();
  const mealSchedules = useStore((s) => s.mealSchedules);
  const mealRecords = useStore((s) => s.mealRecords);
  const todayKey = useStore((s) => s.todayKey);
  const acknowledgeMissedMeal = useStore((s) => s.acknowledgeMissedMeal);

  // v1.2.3 fix: 每 30s tick 一次重新评估 active / missed / next 分支。
  // 之前只在 mount 时跑一次,如果 user 开 home 不动,12:00 跨过 lunch schedule
  // 时不会从 NextMealCard 切到 MealReminderCard,显示停留在错误的卡。
  // 用真 timestamp state 而不是 ignored setTick,避免 React Compiler 当死代码消掉。
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  // 让 nowMs 真被读到,RC 不会把 state 当 dead code 消掉
  void nowMs;

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

  return <NextMealCard />;
}
