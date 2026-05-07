import { Tabs } from "expo-router";
import { colors } from "@src/theme/tokens";

// 4 底部 tab（v0.4 §11.A）：首页 / 记录 / 统计 / 我的
//
// modal 屏（photo / weight-entry / meal-missed / meal-reminder）已抽到
// `app/(modal)/` group，本 group 不再含隐藏 modal screens。
// stage2 屏在 §11.K 第 10 项删除（内容并入 HomeStage2）。

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.green,
        tabBarInactiveTintColor: colors.ink.sub,
        tabBarStyle: {
          backgroundColor: colors.bg.card,
          borderTopColor: colors.border.card,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "首页" }} />
      <Tabs.Screen name="records" options={{ title: "记录" }} />
      <Tabs.Screen name="stats" options={{ title: "统计" }} />
      <Tabs.Screen name="settings" options={{ title: "我的" }} />
    </Tabs>
  );
}
