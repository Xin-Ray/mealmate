import { useRouter, useLocalSearchParams } from "expo-router";
import MissedMealModal from "@src/components/ui/MissedMealModal";
import { useStore } from "@src/store/useStore";
import type { MealSlot } from "@src/types";

// 错过餐次 modal 路由（通知点击 / missed-scan 兜底入口）。
// 现已是次入口 — 主要交互走首页 <MealIncompleteCard>。
// 点"我知道了" 同样调 acknowledgeMissedMeal 标 record acked。

export default function MealMissedRoute() {
  const router = useRouter();
  const { slot } = useLocalSearchParams<{ slot: MealSlot }>();
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";
  const acknowledgeMissedMeal = useStore((s) => s.acknowledgeMissedMeal);
  const todayKey = useStore((s) => s.todayKey);

  return (
    <MissedMealModal
      slot={realSlot}
      onAcknowledge={() => {
        acknowledgeMissedMeal(realSlot, todayKey);
        router.dismiss();
      }}
    />
  );
}
