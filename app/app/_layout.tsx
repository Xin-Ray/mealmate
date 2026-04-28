import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useStore } from "@src/store/useStore";

export default function RootLayout() {
  const rollDayIfNeeded = useStore((s) => s.rollDayIfNeeded);

  useEffect(() => {
    rollDayIfNeeded();
  }, [rollDayIfNeeded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFF8F1" },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
