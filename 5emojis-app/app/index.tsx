import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth-context";
import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../lib/constants";

export default function Index() {
  const { session, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/basics" />;
  }

  return <Redirect href="/(tabs)" />;
}
