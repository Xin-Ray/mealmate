import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="photo"
        options={{
          presentation: "modal",
          gestureEnabled: true,
          contentStyle: { backgroundColor: "#FFF8F1" },
        }}
      />
    </Stack>
  );
}
