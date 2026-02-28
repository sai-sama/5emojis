import { supabase } from "./supabase";
import { Profile, ProfileEmoji, ProfilePhoto } from "./types";

// ─── Types ──────────────────────────────────────────────────
export type FullProfile = {
  profile: Profile;
  emojis: ProfileEmoji[];
  photos: ProfilePhoto[];
  interests: string[];
};

// ─── Fetch full profile ─────────────────────────────────────
export async function fetchFullProfile(userId: string): Promise<FullProfile | null> {
  const [profileRes, emojisRes, photosRes, interestsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("profile_emojis").select("*").eq("user_id", userId).order("position"),
    supabase.from("profile_photos").select("*").eq("user_id", userId).order("position"),
    supabase.from("profile_interests").select("*").eq("user_id", userId),
  ]);

  if (!profileRes.data) return null;

  return {
    profile: profileRes.data,
    emojis: emojisRes.data ?? [],
    photos: photosRes.data ?? [],
    interests: (interestsRes.data ?? []).map((i) => i.interest_tag),
  };
}

// ─── Update profile fields ──────────────────────────────────
export async function updateProfileFields(
  userId: string,
  fields: {
    profession?: string | null;
    life_stage?: string | null;
    friendship_style?: string | null;
    is_new_to_city?: boolean;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId);

  return { error: error?.message ?? null };
}

// ─── Update location ────────────────────────────────────────
export async function updateLocation(
  userId: string,
  location: {
    city: string;
    state: string | null;
    latitude: number;
    longitude: number;
    search_radius_miles?: number;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(location)
    .eq("id", userId);

  return { error: error?.message ?? null };
}

// ─── Update search radius ───────────────────────────────────
export async function updateSearchRadius(
  userId: string,
  radiusMiles: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ search_radius_miles: radiusMiles })
    .eq("id", userId);

  return { error: error?.message ?? null };
}

// ─── Replace emojis (delete all + re-insert) ────────────────
export async function updateEmojis(
  userId: string,
  emojis: string[]
): Promise<{ error: string | null }> {
  // Delete existing
  const { error: deleteError } = await supabase
    .from("profile_emojis")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  // Insert new
  if (emojis.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_emojis")
      .insert(emojis.map((emoji, i) => ({
        user_id: userId,
        emoji,
        position: i + 1,
      })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Replace interests (delete all + re-insert) ─────────────
export async function updateInterests(
  userId: string,
  interests: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_interests")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  if (interests.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_interests")
      .insert(interests.map((tag) => ({
        user_id: userId,
        interest_tag: tag,
      })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Add a photo ─────────────────────────────────────────────
export async function addPhoto(
  userId: string,
  localUri: string,
  position: number
): Promise<{ url: string | null; error: string | null }> {
  const rawExt = localUri.split(".").pop()?.toLowerCase() || "";
  const ext = ["jpg", "jpeg", "png", "webp", "heic"].includes(rawExt) ? rawExt : "jpg";
  const path = `${userId}/${Date.now()}_${position}.${ext}`;

  // Upload to storage (arrayBuffer works in React Native, blob does not)
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, arrayBuffer, { contentType: `image/${ext}` });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(path);

  // Insert photo record
  const { error: insertError } = await supabase
    .from("profile_photos")
    .insert({
      user_id: userId,
      url: urlData.publicUrl,
      position,
      is_primary: position === 1,
    });

  if (insertError) return { url: null, error: insertError.message };

  return { url: urlData.publicUrl, error: null };
}

// ─── Remove a photo ──────────────────────────────────────────
export async function removePhoto(
  photoId: string,
  photoUrl: string
): Promise<{ error: string | null }> {
  // Delete from storage (extract path from URL)
  try {
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/profile-photos\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from("profile-photos").remove([pathMatch[1]]);
    }
  } catch {
    // Storage delete failed — continue with DB delete
  }

  const { error } = await supabase
    .from("profile_photos")
    .delete()
    .eq("id", photoId);

  return { error: error?.message ?? null };
}
