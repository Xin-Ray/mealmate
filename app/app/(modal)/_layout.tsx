import { Stack } from "expo-router";

// (modal) 组：所有屏以 modal presentation 呈现（从下推上来，可下滑关闭）。
// 当前成员：photo / weight-entry / meal-missed / meal-reminder。
//
// v0.5 Plan B：原来挂在这里的 11 个 stage 屏全部移到 (stage) group（普通 page
// presentation + sticky 按钮 layout 修），不再混在 modal 里。

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
