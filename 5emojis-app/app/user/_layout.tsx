import { View } from "react-native";
import { Stack } from "expo-router";
import { COLORS } from "../../lib/constants";

export default function UserLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}
