import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#FAFAFA" },
        headerTintColor: "#6C5CE7",
      }}
    >
      <Stack.Screen name="name" options={{ title: "Your Name" }} />
      <Stack.Screen name="dob" options={{ title: "Birthday" }} />
      <Stack.Screen name="photos" options={{ title: "Photos" }} />
      <Stack.Screen name="emojis" options={{ title: "Your 5 Emojis" }} />
      <Stack.Screen name="details" options={{ title: "About You" }} />
      <Stack.Screen name="location" options={{ title: "Location" }} />
    </Stack>
  );
}
