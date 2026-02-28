import { Tabs } from "expo-router";
import CustomTabBar from "../../components/navigation/CustomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="vibes" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="messages" />
    </Tabs>
  );
}
