import { supabase } from "./supabase";
import { Match, Message, ProfileEmoji, ProfilePhoto, Profile } from "./types";
import { ChatState, getChatState } from "./message-service";
import { logError } from "./error-logger";

// ─── Types ──────────────────────────────────────────────────
export type MatchResult = {
  matched: false;
} | {
  matched: true;
  match: Match;
  otherUser: Profile;
  otherEmojis: ProfileEmoji[];
  otherPhoto: ProfilePhoto | null;
  icebreakerQuestion: string | null;
  otherReveals: string[];
};

export type MatchWithProfile = {
  match: Match;
  otherUser: Profile;
  otherEmojis: ProfileEmoji[];
  otherPhoto: ProfilePhoto | null;
  icebreakerQuestion: string | null;
  otherReveals: string[];
};

export type IncomingVibe = {
  swipeId: string;
  user: Profile;
  emojis: ProfileEmoji[];
  photo: ProfilePhoto | null;
  swipedAt: string;
  isSuperLike: boolean;
};

export type MatchFilter = "all" | "new" | "chatting" | "perfect";

export type EnhancedMatch = MatchWithProfile & {
  chatState: ChatState;
  lastMessage: Message | null;
  lastMessageAt: string;
  unreadCount: number;
  friendshipDuration: string;
};

// ─── Record a swipe and check for new match ─────────────────
export async function recordSwipe(
  swiperId: string,
  swipedId: string,
  direction: "left" | "right",
  isSuperLike: boolean = false
): Promise<MatchResult> {
  // Insert the swipe — DB trigger handles match creation for right swipes
  const { error } = await supabase
    .from("swipes")
    .insert({ swiper_id: swiperId, swiped_id: swipedId, direction, is_super_like: isSuperLike });

  if (error) {
    logError(error, { screen: "SwipeService", context: "record_swipe" });
    return { matched: false };
  }

  // If left swipe, no match possible
  if (direction === "left") {
    return { matched: false };
  }

  // Check if a match was just created (canonical ordering: smaller UUID first)
  const [uid1, uid2] =
    swiperId < swipedId ? [swiperId, swipedId] : [swipedId, swiperId];

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("user1_id", uid1)
    .eq("user2_id", uid2)
    .single();

  if (!match) {
    return { matched: false };
  }

  // Fetch the other user's profile, emojis, primary photo, and icebreaker question
  const otherUserId = swipedId;

  const [profileRes, emojisRes, photoRes, questionRes, revealsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", otherUserId).single(),
    supabase.from("profile_emojis").select("*").eq("user_id", otherUserId),
    supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", otherUserId)
      .eq("is_primary", true)
      .single(),
    match.icebreaker_question_id
      ? supabase
          .from("icebreaker_questions")
          .select("question")
          .eq("id", match.icebreaker_question_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("profile_reveals")
      .select("*")
      .eq("user_id", otherUserId)
      .order("position"),
  ]);

  // Guard against deleted/missing profile (shouldn't happen but defensive)
  if (!profileRes.data) {
    return { matched: false };
  }

  return {
    matched: true,
    match,
    otherUser: profileRes.data,
    otherEmojis: emojisRes.data ?? [],
    otherPhoto: photoRes.data,
    icebreakerQuestion: questionRes.data?.question ?? null,
    otherReveals: (revealsRes.data ?? []).map((r: any) => r.content),
  };
}

// ─── Fetch all matches for a user ───────────────────────────
export async function fetchMatches(
  userId: string
): Promise<MatchWithProfile[]> {
  // Get all matches involving this user + any blocks (for filtering)
  const [matchesRes, blocksRes] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
  ]);

  const matches = matchesRes.data;
  if (matchesRes.error || !matches?.length) {
    return [];
  }

  // Build set of blocked user IDs (both directions)
  const blockedIds = new Set<string>();
  for (const b of blocksRes.data ?? []) {
    if (b.blocker_id === userId) blockedIds.add(b.blocked_id);
    else blockedIds.add(b.blocker_id);
  }

  // Filter out matches with blocked users
  const filteredMatches = matches.filter((match) => {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    return !blockedIds.has(otherUserId);
  });

  if (filteredMatches.length === 0) return [];

  // For each match, fetch the other user's profile + emojis + photo
  const results = await Promise.all(
    filteredMatches.map(async (match) => {
      const otherUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;

      const [profileRes, emojisRes, photoRes, questionRes, revealsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", otherUserId).single(),
        supabase
          .from("profile_emojis")
          .select("*")
          .eq("user_id", otherUserId)
          .order("position"),
        supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", otherUserId)
          .eq("is_primary", true)
          .single(),
        match.icebreaker_question_id
          ? supabase
              .from("icebreaker_questions")
              .select("question")
              .eq("id", match.icebreaker_question_id)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("profile_reveals")
          .select("*")
          .eq("user_id", otherUserId)
          .order("position"),
      ]);

      if (!profileRes.data) return null;

      return {
        match,
        otherUser: profileRes.data,
        otherEmojis: emojisRes.data ?? [],
        otherPhoto: photoRes.data,
        icebreakerQuestion: questionRes.data?.question ?? null,
        otherReveals: (revealsRes.data ?? []).map((r: any) => r.content),
      } satisfies MatchWithProfile;
    })
  );

  return results.filter((r): r is MatchWithProfile => r !== null);
}

// ─── Fetch people who swiped right on you (unmatched) ───────
export async function fetchIncomingVibes(
  userId: string
): Promise<IncomingVibe[]> {
  // Get all right swipes where WE are the swiped person
  const { data: swipes, error } = await supabase
    .from("swipes")
    .select("*")
    .eq("swiped_id", userId)
    .eq("direction", "right")
    .order("created_at", { ascending: false });

  if (error || !swipes?.length) return [];

  // Filter out people we've already swiped on AND blocked users
  const swiperIds = swipes.map((s) => s.swiper_id);

  const [ourSwipesRes, blocksRes] = await Promise.all([
    supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", userId)
      .in("swiped_id", swiperIds),
    supabase
      .from("blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
  ]);

  const alreadySwiped = new Set((ourSwipesRes.data ?? []).map((s) => s.swiped_id));

  // Build set of blocked user IDs (both directions)
  const blockedIds = new Set<string>();
  for (const b of blocksRes.data ?? []) {
    if (b.blocker_id === userId) blockedIds.add(b.blocked_id);
    else blockedIds.add(b.blocker_id);
  }

  // Only keep vibes we haven't acted on and aren't blocked
  const pendingSwipes = swipes.filter(
    (s) => !alreadySwiped.has(s.swiper_id) && !blockedIds.has(s.swiper_id)
  );
  if (pendingSwipes.length === 0) return [];

  const pendingIds = pendingSwipes.map((s) => s.swiper_id);

  // Batch-fetch profiles, emojis, photos
  const [profilesRes, emojisRes, photosRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", pendingIds),
    supabase.from("profile_emojis").select("*").in("user_id", pendingIds).order("position"),
    supabase.from("profile_photos").select("*").in("user_id", pendingIds).eq("is_primary", true),
  ]);

  const profileMap = new Map<string, Profile>();
  for (const p of profilesRes.data ?? []) profileMap.set(p.id, p);

  const emojiMap = new Map<string, ProfileEmoji[]>();
  for (const e of emojisRes.data ?? []) {
    const list = emojiMap.get(e.user_id) ?? [];
    list.push(e);
    emojiMap.set(e.user_id, list);
  }

  const photoMap = new Map<string, ProfilePhoto>();
  for (const p of photosRes.data ?? []) photoMap.set(p.user_id, p);

  return pendingSwipes
    .map((swipe) => {
      const profile = profileMap.get(swipe.swiper_id);
      if (!profile) return null;
      return {
        swipeId: swipe.id,
        user: profile,
        emojis: emojiMap.get(swipe.swiper_id) ?? [],
        photo: photoMap.get(swipe.swiper_id) ?? null,
        swipedAt: swipe.created_at,
        isSuperLike: swipe.is_super_like === true,
      } satisfies IncomingVibe;
    })
    .filter((v): v is IncomingVibe => v !== null)
    .sort((a, b) => {
      // Super likes always appear first
      if (a.isSuperLike && !b.isSuperLike) return -1;
      if (!a.isSuperLike && b.isSuperLike) return 1;
      return 0;
    });
}

// ─── Helpers for enhanced matches ────────────────────────────
function formatFriendshipDuration(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return `${weeks}w`;
  const months = Math.floor(diffDays / 30);
  if (diffDays < 365) return `${months}mo`;
  const years = Math.floor(diffDays / 365);
  return `${years}y`;
}

export function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Fetch matches with message metadata ────────────────────
export async function fetchMatchesEnhanced(
  userId: string
): Promise<EnhancedMatch[]> {
  const matches = await fetchMatches(userId);
  if (matches.length === 0) return [];

  // Batch-fetch all messages for these matches in one query
  const matchIds = matches.map((m) => m.match.id);
  const { data: allMessages } = await supabase
    .from("messages")
    .select("*")
    .in("match_id", matchIds)
    .order("created_at", { ascending: true });

  // Group messages by match_id
  const messagesByMatch = new Map<string, Message[]>();
  for (const msg of (allMessages ?? []) as Message[]) {
    const list = messagesByMatch.get(msg.match_id) ?? [];
    list.push(msg);
    messagesByMatch.set(msg.match_id, list);
  }

  // Enhance each match with chat state, last message, unread count
  const enhanced: EnhancedMatch[] = matches.map((m) => {
    const msgs = messagesByMatch.get(m.match.id) ?? [];
    const otherUserId =
      m.match.user1_id === userId ? m.match.user2_id : m.match.user1_id;

    const chatState = getChatState(msgs, userId, otherUserId);
    const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const unreadCount = msgs.filter(
      (msg) => msg.sender_id !== userId && msg.read_at === null
    ).length;

    return {
      ...m,
      chatState,
      lastMessage,
      lastMessageAt: lastMessage?.created_at ?? m.match.created_at,
      unreadCount,
      friendshipDuration: formatFriendshipDuration(m.match.created_at),
    };
  });

  // Sort by most recent activity
  enhanced.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  return enhanced;
}

// ─── Undo the last swipe ────────────────────────────────────
export async function undoSwipe(
  swiperId: string,
  swipedId: string
): Promise<{ error: string | null }> {
  // 1. Delete the swipe record
  const { error: swipeError } = await supabase
    .from("swipes")
    .delete()
    .eq("swiper_id", swiperId)
    .eq("swiped_id", swipedId);

  if (swipeError) {
    return { error: swipeError.message };
  }

  // 2. Delete any match that was created (no cascade trigger on delete)
  const [uid1, uid2] =
    swiperId < swipedId ? [swiperId, swipedId] : [swipedId, swiperId];

  await supabase
    .from("matches")
    .delete()
    .eq("user1_id", uid1)
    .eq("user2_id", uid2);

  return { error: null };
}

// ─── Unmatch (remove match + messages, no block) ─────────────
export async function unmatchUser(matchId: string): Promise<{ error: string | null }> {
  // Delete the match — messages and reactions cascade-delete via FK constraints
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);
  if (error) return { error: error.message };

  return { error: null };
}
