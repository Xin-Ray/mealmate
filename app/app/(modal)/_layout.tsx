import { Stack } from "expo-router";

// (modal) 组：所有屏以 modal presentation 呈现（从下推上来，可下滑关闭）。
// v0.4 §11.K 第 10 项：未来把 (main)/photo 也抽到这个 group 恢复 modal 视觉。

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    />
  );
}
