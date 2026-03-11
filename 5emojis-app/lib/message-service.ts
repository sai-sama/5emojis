import { supabase } from "./supabase";
import { Message, MessageReaction } from "./types";
import { logError } from "./error-logger";

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

// ─── Update icebreaker emoji response ─────────────────────────
export async function updateIcebreakerResponse(
  messageId: string,
  emojis: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("messages")
    .update({ content: emojis.join("") })
    .eq("id", messageId);
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

// ─── Fetch messages for a match (paginated, newest first then reversed) ──
export const MESSAGE_PAGE_SIZE = 50;

export async function fetchMessages(
  matchId: string,
  limit: number = MESSAGE_PAGE_SIZE,
  beforeDate?: string
): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (beforeDate) {
    query = query.lt("created_at", beforeDate);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { screen: "MessageService", context: "fetch_messages" });
    return [];
  }
  // Reverse so messages are in chronological order
  return (data ?? []).reverse();
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
  onMessage: (message: Message) => void,
  onUpdate?: (message: Message) => void
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
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (onUpdate) {
          onUpdate(payload.new as Message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ─── Reaction quick-pick emojis ──────────────────────────────
export const REACTION_EMOJIS = ["👍", "😂", "🔥", "🤔", "💀"];

// ─── Toggle a reaction on a message ─────────────────────────
export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ added: boolean; error: string | null }> {
  // Atomic delete — returns count of deleted rows to determine if we toggled off
  const { data: deleted, error: delError } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .select("id");

  if (delError) return { added: false, error: delError.message };

  // If we deleted something, the reaction was removed (toggled off)
  if (deleted && deleted.length > 0) {
    return { added: false, error: null };
  }

  // Nothing to delete — add the reaction
  const { error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji });
  return { added: true, error: error?.message ?? null };
}

// ─── Fetch reactions for all messages in a match ────────────
export async function fetchReactions(
  matchId: string
): Promise<Record<string, MessageReaction[]>> {
  const { data, error } = await supabase
    .from("message_reactions")
    .select("*, messages!inner(match_id)")
    .eq("messages.match_id", matchId);

  if (error || !data) return {};

  // Group by message_id
  const grouped: Record<string, MessageReaction[]> = {};
  for (const r of data) {
    const reaction = r as unknown as MessageReaction;
    if (!grouped[reaction.message_id]) grouped[reaction.message_id] = [];
    grouped[reaction.message_id].push(reaction);
  }
  return grouped;
}

// ─── Subscribe to reaction changes ──────────────────────────
export function subscribeToReactions(
  matchId: string,
  onReactionChange: () => void
) {
  const channel = supabase
    .channel(`reactions-${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "message_reactions",
      },
      () => {
        // Re-fetch all reactions when any change happens
        onReactionChange();
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
  try {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("match_id", matchId)
      .neq("sender_id", currentUserId)
      .is("read_at", null);
  } catch {
    // Best effort — don't crash if marking read fails
  }
}
