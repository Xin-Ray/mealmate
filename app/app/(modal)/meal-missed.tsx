import { useRouter, useLocalSearchParams } from "expo-router";
import MissedMealModal from "@src/components/ui/MissedMealModal";
import type { MealSlot } from "@src/types";

// 错过餐次 modal 路由（占位，HP 扣分 + 调度逻辑留 §11.K 第 7 项）
// 调用：router.push({ pathname: '/(modal)/meal-missed', params: { slot } })

export default function MealMissedRoute() {
  const router = useRouter();
  const { slot } = useLocalSearchParams<{ slot: MealSlot }>();
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";

  return (
    <MissedMealModal
      slot={realSlot}
      onAcknowledge={() => router.dismiss()}
    />
  );
}
