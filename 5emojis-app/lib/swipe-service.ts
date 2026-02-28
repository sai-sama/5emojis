import { supabase } from "./supabase";
import { Match, ProfileEmoji, ProfilePhoto, Profile } from "./types";

// ─── Types ──────────────────────────────────────────────────
export type MatchResult = {
  matched: false;
} | {
  matched: true;
  match: Match;
  otherUser: Profile;
  otherEmojis: ProfileEmoji[];
  otherPhoto: ProfilePhoto | null;
};

export type MatchWithProfile = {
  match: Match;
  otherUser: Profile;
  otherEmojis: ProfileEmoji[];
  otherPhoto: ProfilePhoto | null;
};

export type IncomingVibe = {
  swipeId: string;
  user: Profile;
  emojis: ProfileEmoji[];
  photo: ProfilePhoto | null;
  swipedAt: string;
};

// ─── Record a swipe and check for new match ─────────────────
export async function recordSwipe(
  swiperId: string,
  swipedId: string,
  direction: "left" | "right"
): Promise<MatchResult> {
  // Insert the swipe — DB trigger handles match creation for right swipes
  const { error } = await supabase
    .from("swipes")
    .insert({ swiper_id: swiperId, swiped_id: swipedId, direction });

  if (error) {
    console.warn("Failed to record swipe:", error.message);
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

  // Fetch the other user's profile, emojis, and primary photo
  const otherUserId = swipedId;

  const [profileRes, emojisRes, photoRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", otherUserId).single(),
    supabase.from("profile_emojis").select("*").eq("user_id", otherUserId),
    supabase
      .from("profile_photos")
      .select("*")
      .eq("user_id", otherUserId)
      .eq("is_primary", true)
      .single(),
  ]);

  return {
    matched: true,
    match,
    otherUser: profileRes.data!,
    otherEmojis: emojisRes.data ?? [],
    otherPhoto: photoRes.data,
  };
}

// ─── Fetch all matches for a user ───────────────────────────
export async function fetchMatches(
  userId: string
): Promise<MatchWithProfile[]> {
  // Get all matches involving this user
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !matches?.length) {
    return [];
  }

  // For each match, fetch the other user's profile + emojis + photo
  const results = await Promise.all(
    matches.map(async (match) => {
      const otherUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;

      const [profileRes, emojisRes, photoRes] = await Promise.all([
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
      ]);

      if (!profileRes.data) return null;

      return {
        match,
        otherUser: profileRes.data,
        otherEmojis: emojisRes.data ?? [],
        otherPhoto: photoRes.data,
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

  // Filter out people we've already swiped on (already matched or passed)
  const swiperIds = swipes.map((s) => s.swiper_id);

  const { data: ourSwipes } = await supabase
    .from("swipes")
    .select("swiped_id")
    .eq("swiper_id", userId)
    .in("swiped_id", swiperIds);

  const alreadySwiped = new Set((ourSwipes ?? []).map((s) => s.swiped_id));

  // Only keep incoming vibes we haven't acted on yet
  const pendingSwipes = swipes.filter((s) => !alreadySwiped.has(s.swiper_id));
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
      } satisfies IncomingVibe;
    })
    .filter((v): v is IncomingVibe => v !== null);
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
