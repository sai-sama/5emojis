import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { Tabs } from "expo-router";
import CustomTabBar from "../../components/navigation/CustomTabBar";
import { UndoProvider } from "../../lib/undo-context";
import { UnreadProvider } from "../../lib/unread-context";
import { useAuth } from "../../lib/auth-context";
import { refreshLocationIfNeeded } from "../../lib/location-service";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/error-logger";

export default function TabsLayout() {
  const { session, signOut } = useAuth();
  const appState = useRef(AppState.currentState);

  // Auto-refresh session + location on app foreground
  useEffect(() => {
    if (!session?.user) return;

    // Refresh on mount
    refreshLocationIfNeeded(session.user.id);

    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        // Validate session is still fresh — catches expired tokens after 1hr+ background
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) {
            // Token expired or revoked — force sign out
            await signOut();
            return;
          }
        } catch (err: any) {
          // Network error — don't sign out, just log. autoRefreshToken will retry.
          logError(err, { screen: "TabsLayout", context: "session_refresh_on_resume" });
        }

        refreshLocationIfNeeded(session.user.id);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [session]);

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
