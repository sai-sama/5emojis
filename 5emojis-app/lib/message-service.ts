import { supabase } from "./supabase";
import { Message } from "./types";

// ─── Chat state (determines UI mode) ─────────────────────────
export type ChatState = "icebreaker_pending" | "icebreaker_waiting" | "chat_active";

// ─── Send icebreaker emoji response ──────────────────────────
export async function sendIcebreakerResponse(
  matchId: string,
  senderId: string,
  emojis: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: senderId,
    content: emojis.join(""),
    is_emoji_only: true,
  });
  return { error: error?.message ?? null };
}

// ─── Send regular text message ───────────────────────────────
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: senderId,
    content,
    is_emoji_only: false,
  });
  return { error: error?.message ?? null };
}

// ─── Fetch all messages for a match ──────────────────────────
export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Failed to fetch messages:", error.message);
    return [];
  }
  return data ?? [];
}

// ─── Fetch icebreaker question by ID ─────────────────────────
export async function fetchIcebreakerQuestion(
  questionId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("icebreaker_questions")
    .select("question")
    .eq("id", questionId)
    .single();

  if (error || !data) return null;
  return data.question;
}

// ─── Determine chat state from messages ──────────────────────
export function getChatState(
  messages: Message[],
  currentUserId: string,
  otherUserId: string
): ChatState {
  // Find icebreaker responses (first emoji-only message from each user)
  const myIcebreaker = messages.find(
    (m) => m.sender_id === currentUserId && m.is_emoji_only
  );
  const otherIcebreaker = messages.find(
    (m) => m.sender_id === otherUserId && m.is_emoji_only
  );

  if (myIcebreaker && otherIcebreaker) return "chat_active";
  if (myIcebreaker && !otherIcebreaker) return "icebreaker_waiting";
  return "icebreaker_pending";
}

// ─── Subscribe to new messages (real-time) ───────────────────
export function subscribeToMessages(
  matchId: string,
  onMessage: (message: Message) => void
) {
  const channel = supabase
    .channel(`chat-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Mark messages as read ───────────────────────────────────
export async function markMessagesAsRead(
  matchId: string,
  currentUserId: string
): Promise<void> {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);
}
