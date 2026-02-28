import { supabase } from "./supabase";
import { Profile, ProfileEmoji, ProfilePhoto } from "./types";

// ─── Types ──────────────────────────────────────────────────
export type DiscoveryProfile = {
  profile: Profile;
  emojis: ProfileEmoji[];
  photo: ProfilePhoto;
};

// ─── Fetch the user's own profile (for location + radius) ───
export async function fetchOwnProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Fetch discovery feed via nearby_profiles RPC ───────────
export async function fetchDiscoveryFeed(
  userId: string,
  userLat: number,
  userLng: number,
  radiusMiles: number,
  intentFilter?: string | null
): Promise<DiscoveryProfile[]> {
  // Call the PostGIS-powered RPC function
  // It already filters out: own profile, blocked users, already-swiped users
  const { data: profiles, error } = await supabase.rpc("nearby_profiles", {
    user_lat: userLat,
    user_lng: userLng,
    radius_miles: radiusMiles,
    current_user_id: userId,
    intent_filter: intentFilter ?? null,
  });

  if (error || !profiles?.length) {
    if (error) console.warn("Discovery feed error:", error.message);
    return [];
  }

  // Batch-fetch emojis and primary photos for all discovered profiles
  const profileIds = profiles.map((p: Profile) => p.id);

  const [emojisRes, photosRes] = await Promise.all([
    supabase
      .from("profile_emojis")
      .select("*")
      .in("user_id", profileIds)
      .order("position"),
    supabase
      .from("profile_photos")
      .select("*")
      .in("user_id", profileIds)
      .eq("is_primary", true),
  ]);

  // Index by user_id for fast lookup
  const emojisByUser = new Map<string, ProfileEmoji[]>();
  for (const emoji of emojisRes.data ?? []) {
    const list = emojisByUser.get(emoji.user_id) ?? [];
    list.push(emoji);
    emojisByUser.set(emoji.user_id, list);
  }

  const photoByUser = new Map<string, ProfilePhoto>();
  for (const photo of photosRes.data ?? []) {
    photoByUser.set(photo.user_id, photo);
  }

  // Assemble DiscoveryProfile objects — skip anyone missing a photo
  return profiles
    .map((profile: Profile) => {
      const photo = photoByUser.get(profile.id);
      if (!photo) return null; // No primary photo = skip (shouldn't happen, but defensive)

      return {
        profile,
        emojis: emojisByUser.get(profile.id) ?? [],
        photo,
      } satisfies DiscoveryProfile;
    })
    .filter((p: DiscoveryProfile | null): p is DiscoveryProfile => p !== null);
}
