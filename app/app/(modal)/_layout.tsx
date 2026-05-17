import { Stack } from "expo-router";

// (modal) 组：所有屏以 modal presentation 呈现（从下推上来，可下滑关闭）。
// v0.4 §11.K 第 10 项：未来把 (main)/photo 也抽到这个 group 恢复 modal 视觉。
//
// 五阶段过渡屏（stage-{1..5}-{start,end}）走 fullScreenModal —— 全屏白底、
// 不可手势下滑关闭，必须点 CTA 才能 dismiss。

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      {[1, 2, 3, 4, 5].flatMap((n) =>
        ["start", "end"].map((k) => (
          <Stack.Screen
            key={`stage-${n}-${k}`}
            name={`stage-${n}-${k}`}
            options={{
              presentation: "fullScreenModal",
              gestureEnabled: false,
            }}
          />
        ))
      )}
    </Stack>
  );
}
