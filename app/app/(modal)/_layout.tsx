import { Stack } from "expo-router";

// (modal) 组：所有屏以 modal presentation 呈现（从下推上来，可下滑关闭）。
// v0.4 §11.K 第 10 项：未来把 (main)/photo 也抽到这个 group 恢复 modal 视觉。
//
// 阶段过渡屏走 card presentation + slide_from_right（v0.5 bug2 fix）：
//   - 之前用 fullScreenModal 从下弹起，视觉太像"临时浮层"
//   - xin 反馈想要"页面"感觉 —— 从右往左 push，跟普通 navigation 一样
//   - CTA 用 router.replace('/(main)/home') 关闭，避免 back stack 残留
//   - 注：(modal) group 在 root layout 仍配 presentation:'modal'（整个 group 弹起）；
//     如视觉上 stage 屏还是从下弹（root modal 优先），需走 Plan B（移出 (modal) group）
//
// 11 个屏：
//   - stage-1-start：新用户首次进 home 一次性弹
//   - stage-{1..5}-end：advance 时弹（v0.5 bug1 fix：CTA 用 replace 强跳 home）
//   - stage-{1..5}-demote：HP<0 时弹（stage 1 demote 走 support 调，PRD §11.L）
// （stage-{2..5}-start 已废弃 —— end CTA 直接关闭回 home，不再串接下一阶段 start）

const TRANSITION_SCREENS: string[] = [
  "stage-1-start",
  ...[1, 2, 3, 4, 5].map((n) => `stage-${n}-end`),
  ...[1, 2, 3, 4, 5].map((n) => `stage-${n}-demote`),
];

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      {TRANSITION_SCREENS.map((name) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
      ))}
    </Stack>
  );
}
