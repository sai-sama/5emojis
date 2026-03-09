import { View } from "react-native";
import { Stack } from "expo-router";
import { ProfileProvider } from "../../lib/profile-context";
import { COLORS } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";

export default function ProfileLayout() {
  return (
    <ProfileProvider>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AuroraBackground variant="warm" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" options={{ animation: "none" }} />
          <Stack.Screen name="personal" />
          <Stack.Screen name="photos" />
          <Stack.Screen name="about" />
          <Stack.Screen name="more" />
          <Stack.Screen name="location" />
          <Stack.Screen name="hidden-emojis" />
        </Stack>
      </View>
    </ProfileProvider>
  );
}
