import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import Mascot from "@src/components/Mascot";
import { useStore } from "@src/store/useStore";
import type { WeightRecord } from "@src/types";

const BAR_AREA_HEIGHT = 80;

const fmtKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const fmtMD = (key: string) => {
  const [, m, d] = key.split("-");
  return `${parseInt(m, 10)}-${parseInt(d, 10)}`;
};

const fmtTime = (ms: number) => {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

// 滚动 7 天柱状条（最右是今天）；纯 RN <View>，零 native 依赖。
// v0.4 候选换 react-native-chart-kit 做真折线图（30 / 90 天切换）。
function WeightBars({ records }: { records: WeightRecord[] }) {
  const todayDate = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - (6 - i));
    const key = fmtKey(d);
    const rec = records.find((r) => r.date === key);
    return { key, dateLabel: `${d.getDate()}`, kg: rec?.kg ?? null };
  });

  const values = days
    .map((d) => d.kg)
    .filter((v): v is number => v !== null);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const range = max - min || 1;

  return (
    <View>
      <View className="flex-row items-end" style={{ height: BAR_AREA_HEIGHT }}>
        {days.map((d) => {
          const norm = d.kg !== null ? (d.kg - min) / range : 0;
          const barH =
            d.kg !== null ? Math.max(12, norm * BAR_AREA_HEIGHT) : 0;
          return (
            <View
              key={d.key}
              className="flex-1 items-center justify-end"
            >
              <View
                className={
                  d.kg !== null
                    ? "bg-accent rounded-t"
                    : "bg-hpEmpty rounded-t"
                }
                style={{ width: 14, height: barH || 4 }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row mt-2">
        {days.map((d) => (
          <Text
            key={d.key}
            className="flex-1 text-sub text-[10px] text-center"
          >
            {d.dateLabel}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function Stage2Screen() {
  const router = useRouter();
  const hp = useStore((s) => s.hp);
  const currentStage = useStore((s) => s.currentStage);
  const weightHistory = useStore((s) => s.weightHistory);

  // Stage 1 用户进来 → 保留"功能即将到来"占位（避免没数据的空 UI）
  if (currentStage === 1) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <View className="flex-1 items-center justify-center px-6">
          <Mascot hp={hp} stage={2} size={140} />
          <Text className="text-ink text-2xl font-semibold mb-3 mt-6">
            阶段 2 · 量化
          </Text>
          <Text className="text-sub text-base text-center leading-6 mb-10">
            完成 Stage 1 后解锁。{"\n"}
            届时这里会出现体重打卡 + 量化数据面板。
          </Text>
          <Pressable
            onPress={() => router.replace("/(main)/home")}
            className="rounded-2xl py-4 px-8 bg-accent"
          >
            <Text className="text-white font-semibold">回到首页</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Stage 2：体重仪表板
  const latest = weightHistory[weightHistory.length - 1];
  const previous = weightHistory[weightHistory.length - 2];
  const delta =
    latest && previous ? latest.kg - previous.kg : null;
  const deltaLabel =
    delta === null
      ? null
      : delta === 0
        ? "持平"
        : delta > 0
          ? `+${delta.toFixed(1)} kg`
          : `${delta.toFixed(1)} kg`;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-ink text-2xl font-semibold">
            阶段 2 · 量化
          </Text>
          <Pressable onPress={() => router.replace("/(main)/home")}>
            <Text className="text-sub text-sm">回首页</Text>
          </Pressable>
        </View>

        <View className="items-center mb-6">
          <Mascot hp={hp} stage={2} size={120} />
        </View>

        {/* 最近一次体重 */}
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-4">
          <Text className="text-sub text-xs mb-2">最近一次</Text>
          {latest ? (
            <>
              <Text className="text-ink text-3xl font-semibold">
                {latest.kg.toFixed(1)} kg
              </Text>
              <Text className="text-sub text-xs mt-1">
                {fmtMD(latest.date)} · {fmtTime(latest.recordedAt)}
                {deltaLabel ? ` · 较上次 ${deltaLabel}` : ""}
              </Text>
            </>
          ) : (
            <Text className="text-sub text-base">
              还没有记录哦，去录一条吧。
            </Text>
          )}
        </View>

        {/* 7 天柱状条 */}
        <View className="bg-white border border-cardBorder rounded-2xl px-5 py-4 mb-4">
          <Text className="text-sub text-xs mb-3">最近 7 天</Text>
          <WeightBars records={weightHistory} />
        </View>

        {/* 录入按钮 */}
        <Pressable
          onPress={() =>
            // typed-routes 生成是 Metro 启动时扫 app/ 目录写的；新加的 weight-entry
            // 在 .expo/types/router.d.ts 还没扫到，下次 Metro 启动后 cast 可移除
            router.push("/(main)/weight-entry" as Href)
          }
          className="rounded-2xl py-4 bg-accent items-center mb-6"
        >
          <Text className="text-white font-semibold">+ 录入今日体重</Text>
        </Pressable>

        {/* 历史列表（倒序，最多 30 条） */}
        {weightHistory.length > 0 && (
          <>
            <Text className="text-sub text-xs mb-2">历史</Text>
            <View className="bg-white border border-cardBorder rounded-2xl">
              {[...weightHistory]
                .reverse()
                .slice(0, 30)
                .map((r, i, arr) => (
                  <View
                    key={r.date}
                    className={`flex-row items-center justify-between px-5 py-3 ${
                      i < arr.length - 1 ? "border-b border-cardBorder" : ""
                    }`}
                  >
                    <View className="flex-row items-center">
                      {r.photoUri ? (
                        <Image
                          source={{ uri: r.photoUri }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View className="w-8 h-8 rounded-lg bg-hpEmpty mr-3" />
                      )}
                      <Text className="text-ink text-base">
                        {fmtMD(r.date)}
                      </Text>
                    </View>
                    <Text className="text-ink text-base font-semibold">
                      {r.kg.toFixed(1)} kg
                    </Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
