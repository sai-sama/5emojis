import "../global.css";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
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
import { loadMuteSetting } from "../lib/sounds";
import { initErrorLogging, logError } from "../lib/error-logger";
import { addNotificationResponseListener } from "../lib/push-notifications";
import { router } from "expo-router";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      context: "error-boundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😵</Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 16 }}>
            The error has been logged automatically.
          </Text>
          <ScrollView style={{ maxHeight: 120, marginBottom: 20, width: "100%" }}>
            <Text style={{ fontSize: 11, color: "#999", fontFamily: "monospace" }}>
              {this.state.error?.message}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    loadMuteSetting();
    initErrorLogging();

    // Handle notification taps → navigate to chat
    const cleanup = addNotificationResponseListener((matchId) => {
      router.push(`/chat/${matchId}`);
    });
    return cleanup;
  }, []);

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
        <ErrorBoundary>
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
            <Stack.Screen
              name="suspended"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
          </Stack>
        </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
