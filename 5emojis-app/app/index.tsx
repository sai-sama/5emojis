import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { session, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8F0" }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/name" />;
  }

  return <Redirect href="/(tabs)" />;
}
