import { Stack } from "expo-router";
import { ProfileProvider } from "../../lib/profile-context";
import { COLORS } from "../../lib/constants";

export default function ProfileLayout() {
  return (
    <ProfileProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="personal" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="about" />
        <Stack.Screen name="location" />
      </Stack>
    </ProfileProvider>
  );
}
