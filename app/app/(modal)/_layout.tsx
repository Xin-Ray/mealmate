import { Stack } from "expo-router";

// (modal) 组：所有屏以 modal presentation 呈现（从下推上来，可下滑关闭）。
// v0.4 §11.K 第 10 项：未来把 (main)/photo 也抽到这个 group 恢复 modal 视觉。
//
// 阶段过渡屏走 fullScreenModal（全屏白底、不可手势下滑、必须点 CTA 才能 dismiss）：
//   - stage-1-start：新用户首次进 home 一次性弹
//   - stage-{1..5}-end：advance 时弹
//   - stage-{1..5}-demote：HP<0 时弹（stage 1 demote 不变 stage，鼓励调）
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
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
      ))}
    </Stack>
  );
}
