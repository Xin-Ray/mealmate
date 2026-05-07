import { Tabs } from "expo-router";
import { colors } from "@src/theme/tokens";

// 4 底部 tab（v0.4 §11.A）：首页 / 记录 / 统计 / 我的
// photo / stage2 隐藏（href:null），仍可被 router.push/通知点击命中。
//
// photo 暂留 (main) 内，丢失从下推上来的 modal 视觉效果。
// 未来一项专门 commit 把 photo 抽到 root level 的 (modal) group 恢复。
//
// settings 文件名不动，tab label 显示"我的"。

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

      {/* 隐藏路由（仍可 router.push） */}
      <Tabs.Screen
        name="photo"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="stage2"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
