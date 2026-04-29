import { View, Text } from "react-native";
import type { TodayMeals } from "@src/types";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const fmtKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const countDone = (meals?: TodayMeals): number => {
  if (!meals) return 0;
  return (["breakfast", "lunch", "dinner"] as const).filter(
    (s) => meals[s] === "done"
  ).length;
};

type Props = {
  todayKey: string;
  todayMeals: TodayMeals;
  history: Record<string, TodayMeals>;
};

// 周一到周日的 7 列条带，今天高亮，每天用 3 个小点表示三餐完成度
export default function WeekStrip({ todayKey, todayMeals, history }: Props) {
  const today = new Date(todayKey + "T00:00:00");
  const weekday = today.getDay(); // 0=Sun ... 6=Sat
  const mondayOffset = (weekday + 6) % 7; // Mon=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = fmtKey(d);
    const isToday = key === todayKey;
    const isFuture = d > today && !isToday;
    const meals = isToday ? todayMeals : history[key];
    return {
      key,
      dom: d.getDate(),
      weekday: WEEKDAYS[i],
      isToday,
      isFuture,
      doneCount: countDone(meals),
    };
  });

  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日 · 周${WEEKDAYS[mondayOffset]}`;

  return (
    <View>
      <Text className="text-sub text-xs mb-2">{dateLabel}</Text>
      <View className="flex-row gap-1.5">
        {days.map((day) => (
          <View
            key={day.key}
            className={`flex-1 items-center py-2.5 rounded-xl ${
              day.isToday
                ? "bg-accent/20 border border-accent"
                : "bg-white border border-cardBorder"
            } ${day.isFuture ? "opacity-40" : ""}`}
          >
            <Text
              className={`text-[10px] ${
                day.isToday ? "text-accent" : "text-sub"
              }`}
            >
              {day.weekday}
            </Text>
            <Text
              className={`text-base font-semibold mt-0.5 ${
                day.isToday ? "text-accent" : "text-ink"
              }`}
            >
              {day.dom}
            </Text>
            <View className="flex-row gap-0.5 mt-1">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    i < day.doneCount ? "bg-ok" : "bg-hpEmpty"
                  }`}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
