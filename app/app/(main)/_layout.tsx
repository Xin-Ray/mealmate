import { Tabs } from "expo-router";
import { Image, type ImageSourcePropType } from "react-native";
import { colors } from "@src/theme/tokens";

// 4 底部 tab（v0.4 §11.A，hotfix #3 接 Figma icon 资源）
//
// 每个 tab 双态 icon（实心 selected / 线框 unselected）。
// label 字号 12pt；focused 色 #3A6436（与 stage 2 倒计时数字色一致）；
// unfocused 色 #B4B4B4。

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
