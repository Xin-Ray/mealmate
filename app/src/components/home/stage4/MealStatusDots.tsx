import { selectTodayMealStars } from "@src/store/selectors/mealStars";
import { useStore } from "@src/store/useStore";
import { colors } from "@src/theme/tokens";
import { Text, View } from "react-native";

// 早午晚 status 圆（Figma 59:297 row 6）：3 个圆
// done → 绿；missed → 暖橘；pending → 灰

const SLOT_LABEL: Record<"breakfast" | "lunch" | "dinner", string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

const Dot = ({
  status,
  label,
}: {
  status: "done" | "missed" | "pending";
  label: string;
}) => {
  const bg =
    status === "done"
      ? colors.brand.green
      : status === "missed"
      ? colors.brand.accent
      : colors.bg.hpEmpty;
  const txt = status === "pending" ? colors.ink.sub : "#FFFFFF";
  const icon = status === "done" ? "✓" : status === "missed" ? "✗" : "·";
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: txt, fontSize: 16, fontWeight: "600" }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 12, color: colors.ink.sub, marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
};

export default function MealStatusDots() {
  const todayMeals = useStore((s) => s.todayMeals);
  const stars = selectTodayMealStars({ todayMeals });

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderColor: colors.border.card,
        borderWidth: 1,
        marginTop: 12,
      }}
    >
      {(["breakfast", "lunch", "dinner"] as const).map((slot) => (
        <Dot key={slot} status={stars[slot]} label={SLOT_LABEL[slot]} />
      ))}
    </View>
  );
}
