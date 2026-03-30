import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

type UnreadContextType = {
  unreadCount: number;
  refresh: () => void;
  markAllAsRead: () => Promise<void>;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  refresh: () => {},
  markAllAsRead: async () => {},
});

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .neq("sender_id", session.user.id)
      .is("read_at", null)
      .in(
        "match_id",
        (await supabase
          .from("matches")
          .select("id")
          .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        ).data?.map((m) => m.id) ?? []
      );
    setUnreadCount(count ?? 0);
  }, [session]);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user) return;
    // Get all match IDs for this user
    const { data: matchRows } = await supabase
      .from("matches")
      .select("id")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
    const matchIds = matchRows?.map((m) => m.id) ?? [];
    if (matchIds.length === 0) return;

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .neq("sender_id", session.user.id)
      .is("read_at", null)
      .in("match_id", matchIds);

    setUnreadCount(0);
  }, [session]);

  // Track user's match IDs so we can filter realtime messages
  const matchIdsRef = useRef<Set<string>>(new Set());

  // Refresh on mount and subscribe to new messages
  useEffect(() => {
    if (!session?.user) return;

    // Pre-fetch match IDs for realtime filtering
    supabase
      .from("matches")
      .select("id")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .then(({ data }) => {
        matchIdsRef.current = new Set((data ?? []).map((m) => m.id));
      });
    refresh();

    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Only count messages from user's own matches
          if (
            payload.new.sender_id !== session.user.id &&
            matchIdsRef.current.has(payload.new.match_id)
          ) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // A message was marked as read — recalculate
          if (payload.new.read_at && !payload.old?.read_at) {
            refresh();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          // New match — add to tracking set so future messages are counted
          matchIdsRef.current.add(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  // Sync app icon badge count
  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount).catch(() => {});
  }, [unreadCount]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refresh, markAllAsRead }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
