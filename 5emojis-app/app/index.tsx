import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth-context";
import { View, Image, ActivityIndicator } from "react-native";
import { COLORS } from "../lib/constants";
import BrandLogo from "../components/BrandLogo";

export default function Index() {
  const { session, loading, needsOnboarding, isSuspended } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <BrandLogo size="large" />
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isSuspended) {
    return <Redirect href="/suspended" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(onboarding)/basics" />;
  }

  return <Redirect href="/(tabs)" />;
}
