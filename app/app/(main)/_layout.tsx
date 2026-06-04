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
//   1. transitionsPending 队首（HP 边界触发的 end/demote）→ push 对应 modal + 立即 consume
//   2. 否则：当前 stage 是 1 且 stage-1-start 未看 → 弹 stage-1-start（一次性）
// stage{2-5}-start 已删；advance 后 end modal CTA 直接关闭回 home，不串接 start。

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
  const transitionsPending = useStore((s) => s.transitionsPending);
  const consumeTransition = useStore((s) => s.consumeTransition);

  useEffect(() => {
    // 延迟一帧等 (main) navigator 挂载完，避免在 mount 同帧 navigate
    const t = setTimeout(() => {
      // 1. 优先消费 pending 队首（advance/demote 触发）
      //    用 router.replace 切到 (stage) 全屏 page（v0.5 Plan B），按钮再 replace 回 home
      // v1.2.1: stage 0.5 路径段用 "0_5"(expo-router 文件名不允许 "."),stageSegment 映射
      if (transitionsPending.length > 0) {
        const next = transitionsPending[0];
        const seg = next.stage === 0.5 ? "0_5" : String(next.stage);
        router.replace(`/(stage)/stage-${seg}-${next.kind}` as never);
        consumeTransition();
        return;
      }
      // 2. 否则 stage-1-start 一次性触发（基于 transitionsSeen）
      // v1.2.1: 新装用户从 Stage 0 起步,这条 stage-1-start fallback 只对老用户生效
      if (
        currentStage === 1 &&
        !transitionsSeen.some((t) => t.stage === 1 && t.kind === "start")
      ) {
        router.replace(`/(stage)/stage-1-start` as never);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [currentStage, transitionsSeen, transitionsPending, consumeTransition, router]);

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
