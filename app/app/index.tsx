import { useEffect } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useStore } from "@src/store/useStore";

// 入口路由：根据 onboardingDone + currentStage 决定跳哪
export default function Index() {
  const onboardingDone = useStore((s) => s.onboardingDone);
  const hydrated = useStore.persist?.hasHydrated?.() ?? true;

  useEffect(() => {}, []);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding/eating" />;
  }
  return <Redirect href="/(main)/home" />;
}
