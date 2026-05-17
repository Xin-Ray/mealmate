import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Image, type ImageSourcePropType } from "react-native";
import { colors } from "@src/theme/tokens";
import { useStore } from "@src/store/useStore";

// 4 底部 tab（v0.4 §11.A，hotfix #3 接 Figma icon 资源）
//
// 每个 tab 双态 icon（实心 selected / 线框 unselected）。
// label 字号 12pt；focused 色 #3A6436（与 stage 2 倒计时数字色一致）；
// unfocused 色 #B4B4B4。
//
// 阶段过渡屏触发（feature/stage-transitions）：
// 每当 currentStage 或 transitionsSeen 变化时检查：
//   1. 任何先前 stage 的 end 未看 → 按序优先弹（advance 时触发 prev end）
//   2. 当前 stage 的 start 未看 → 弹 start
// 入口幂等：dismiss 时 markTransitionSeen，再触发不会重弹。

const ICONS: Record<string, { on: ImageSourcePropType; off: ImageSourcePropType }> = {
  home: {
    on: require("../../assets/tab-icons/home-on.png"),
    off: require("../../assets/tab-icons/home-off.png"),
  },
  records: {
    on: require("../../assets/tab-icons/records-on.png"),
    off: require("../../assets/tab-icons/records-off.png"),
  },
  stats: {
    on: require("../../assets/tab-icons/stats-on.png"),
    off: require("../../assets/tab-icons/stats-off.png"),
  },
  // 路由名仍是 settings（v0.4 #2 没改文件名），label 显示"我的"，icon 用 my-on/off
  settings: {
    on: require("../../assets/tab-icons/my-on.png"),
    off: require("../../assets/tab-icons/my-off.png"),
  },
};

const renderIcon = (name: keyof typeof ICONS) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return (
      <Image
        source={focused ? ICONS[name].on : ICONS[name].off}
        style={{ width: 28, height: 28 }}
        resizeMode="contain"
      />
    );
  };

export default function MainLayout() {
  const router = useRouter();
  const currentStage = useStore((s) => s.currentStage);
  const transitionsSeen = useStore((s) => s.transitionsSeen);

  useEffect(() => {
    // 延迟一帧等 (main) navigator 挂载完，避免在 mount 同帧 push modal
    const t = setTimeout(() => {
      // 先弹任何先前 stage 的 end（advance 时的链式触发）
      for (let s = 1; s < currentStage; s++) {
        const seenEnd = transitionsSeen.some(
          (t) => t.stage === s && t.kind === "end"
        );
        if (!seenEnd) {
          router.push(`/(modal)/stage-${s}-end` as never);
          return;
        }
      }
      // 再弹当前 stage 的 start
      const seenStart = transitionsSeen.some(
        (t) => t.stage === currentStage && t.kind === "start"
      );
      if (!seenStart) {
        router.push(`/(modal)/stage-${currentStage}-start` as never);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [currentStage, transitionsSeen, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3A6436",
        tabBarInactiveTintColor: "#B4B4B4",
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.bg.card,
          borderTopColor: colors.border.card,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "首页", tabBarIcon: renderIcon("home") }}
      />
      <Tabs.Screen
        name="records"
        options={{ title: "记录", tabBarIcon: renderIcon("records") }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: "统计", tabBarIcon: renderIcon("stats") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "我的", tabBarIcon: renderIcon("settings") }}
      />
    </Tabs>
  );
}
