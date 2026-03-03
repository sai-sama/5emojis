import { View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OnboardingProvider } from "../../lib/onboarding-context";
import { COLORS } from "../../lib/constants";
import BrandLogo from "../../components/BrandLogo";
import AuroraBackground from "../../components/skia/AuroraBackground";
import OnboardingProgress from "../../components/OnboardingProgress";

export default function OnboardingLayout() {
  const insets = useSafeAreaInsets();

  return (
    <OnboardingProvider>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <AuroraBackground variant="warm" />
        <Stack
          screenOptions={{
            headerShown: true,
            headerBackTitle: "Back",
            headerShadowVisible: false,
            headerTransparent: true,
            headerStyle: { backgroundColor: "transparent" },
            headerTintColor: COLORS.primary,
            headerTitle: () => <BrandLogo size="compact" />,
            contentStyle: { backgroundColor: "transparent" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="name" options={{ title: "Your Name" }} />
          <Stack.Screen name="dob" options={{ title: "Birthday" }} />
          <Stack.Screen name="gender" options={{ title: "Gender" }} />
          <Stack.Screen name="photos" options={{ title: "Photos" }} />
          <Stack.Screen name="emojis" options={{ title: "Your 5 Emojis" }} />
          <Stack.Screen name="details" options={{ title: "About You" }} />
          <Stack.Screen name="availability" options={{ title: "Availability" }} />
          <Stack.Screen name="personality" options={{ title: "Personality" }} />
          <Stack.Screen name="age-pref" options={{ title: "Age Preference" }} />
          <Stack.Screen name="location" options={{ title: "Location" }} />
        </Stack>
        {/* Progress bar floating below header */}
        <View style={{ position: "absolute", top: insets.top + 44, left: 0, right: 0, zIndex: 10 }}>
          <OnboardingProgress />
        </View>
      </View>
    </OnboardingProvider>
  );
}
