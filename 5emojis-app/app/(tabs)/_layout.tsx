import { Tabs } from "expo-router";
import CustomTabBar from "../../components/navigation/CustomTabBar";
import { UndoProvider } from "../../lib/undo-context";
import { UnreadProvider } from "../../lib/unread-context";

export default function TabsLayout() {
  return (
    <UnreadProvider>
      <UndoProvider>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="vibes" />
          <Tabs.Screen name="index" />
        </Tabs>
      </UndoProvider>
    </UnreadProvider>
  );
}
