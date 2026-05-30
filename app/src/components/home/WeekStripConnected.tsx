import WeekStrip from "@src/components/WeekStrip";
import { useStore } from "@src/store/useStore";

// r1 F5：周一到周日吃饭记录表。xin 要求 5 个 stage home 都有。
// 原 HomeStage1 直接 import WeekStrip + wire store；其它 stage 用这层
// connected wrapper 避免重复 store 读取代码。
//
// 不动 WeekStrip 内部组件本身（HomeStage1 / 周视图原作不变）。

export default function WeekStripConnected() {
  const todayKey = useStore((s) => s.todayKey);
  const todayMeals = useStore((s) => s.todayMeals);
  const mealHistory = useStore((s) => s.mealHistory);
  return (
    <WeekStrip
      todayKey={todayKey}
      todayMeals={todayMeals}
      history={mealHistory}
    />
  );
}
