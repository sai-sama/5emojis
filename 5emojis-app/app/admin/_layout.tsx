import { View } from "react-native";
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { COLORS } from "../../lib/constants";

export default function AdminLayout() {
  const { isAdmin } = useAuth();

  // Guard: non-admin users can't access this section
  if (!isAdmin) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}
