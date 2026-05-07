import { useRouter, useLocalSearchParams } from "expo-router";
import MealReminderModal from "@src/components/ui/MealReminderModal";
import type { MealSlot } from "@src/types";

// 餐次到点提醒 modal 路由（占位，业务接入留 §11.K 第 7 项）
// 调用：router.push({ pathname: '/(modal)/meal-reminder', params: { slot } })

export default function MealReminderRoute() {
  const router = useRouter();
  const { slot } = useLocalSearchParams<{ slot: MealSlot }>();
  const realSlot: MealSlot = (slot as MealSlot) ?? "lunch";

  return (
    <MealReminderModal
      slot={realSlot}
      onCapture={() => {
        router.dismiss();
        router.push({
          pathname: "/(modal)/photo",
          params: { slot: realSlot },
        } as never);
      }}
      onDismiss={() => router.dismiss()}
    />
  );
}
