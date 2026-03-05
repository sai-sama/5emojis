import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

type UnreadContextType = {
  unreadCount: number;
  refresh: () => void;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  refresh: () => {},
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

  // Refresh on mount and subscribe to new messages
  useEffect(() => {
    if (!session?.user) return;
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
          if (payload.new.sender_id !== session.user.id) {
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
          filter: `read_at=neq.null`,
        },
        () => {
          // A message was marked as read — recalculate
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
