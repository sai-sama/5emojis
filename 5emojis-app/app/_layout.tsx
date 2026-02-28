import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { YoungSerif_400Regular } from "@expo-google-fonts/young-serif";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { AuthProvider } from "../lib/auth-context";
import { COLORS } from "../lib/constants";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "YoungSerif-Regular": YoungSerif_400Regular,
    "DMSans-Regular": DMSans_400Regular,
    "DMSans-Medium": DMSans_500Medium,
    "DMSans-SemiBold": DMSans_600SemiBold,
    "DMSans-Bold": DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👋🎉🌟💜🤝</Text>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen
              name="profile"
              options={{
                presentation: "modal",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="chat/[matchId]"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
