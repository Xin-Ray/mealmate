import { Stack } from "expo-router";

// (stage) 组：阶段过渡屏（11 个：stage-1-start + stage-{1..5}-end + stage-{1..5}-demote）。
//
// **不在 (modal) group**（v0.5 Plan B 重构）—— 之前放在 (modal) 里被 root 强制
// modal presentation 从下弹起 + sticky button 被 layout 推到屏外，xin 反馈无法用。
// 现在独立 (stage) group + 普通 card presentation + 从右进入，屏内 layout 用
// SafeAreaView + ScrollView flex:1 + 绝对定位 footer 保证按钮永远可见。
//
// 进入：从 (main)/_layout useEffect 用 router.replace('/(stage)/...') push 整屏代替 home
// 离开：屏内按钮调 router.replace('/(main)/home') 切回 home tab，无 modal 关闭动画

export default function StageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: false, // 禁掉手势返回，必须点按钮
      }}
    />
  );
}
