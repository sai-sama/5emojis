import { supabase } from "./supabase";
import { Profile, ProfileEmoji, ProfilePhoto } from "./types";
import { preparePhoto } from "./image-utils";
import { decode } from "base64-arraybuffer";
import { logError } from "./error-logger";

// ─── Types ──────────────────────────────────────────────────
export type FullProfile = {
  profile: Profile;
  emojis: ProfileEmoji[];
  photos: ProfilePhoto[];
  interests: string[];
  languages: string[];
  availability: string[];
  pets: string[];
  dietary: string[];
  reveals: string[];
};

// ─── Fetch full profile ─────────────────────────────────────
export async function fetchFullProfile(userId: string): Promise<FullProfile | null> {
  const [profileRes, emojisRes, photosRes, interestsRes, langsRes, availRes, petsRes, dietaryRes, revealsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("profile_emojis").select("*").eq("user_id", userId).order("position"),
    supabase.from("profile_photos").select("*").eq("user_id", userId).order("position"),
    supabase.from("profile_interests").select("*").eq("user_id", userId),
    supabase.from("profile_languages").select("*").eq("user_id", userId),
    supabase.from("profile_availability").select("*").eq("user_id", userId),
    supabase.from("profile_pets").select("*").eq("user_id", userId),
    supabase.from("profile_dietary").select("*").eq("user_id", userId),
    supabase.from("profile_reveals").select("*").eq("user_id", userId).order("position"),
  ]);

  if (!profileRes.data) return null;

  return {
    profile: profileRes.data,
    emojis: emojisRes.data ?? [],
    photos: photosRes.data ?? [],
    interests: (interestsRes.data ?? []).map((i) => i.interest_tag),
    languages: (langsRes.data ?? []).map((l: any) => l.language),
    availability: (availRes.data ?? []).map((a: any) => a.slot),
    pets: (petsRes.data ?? []).map((p: any) => p.pet),
    dietary: (dietaryRes.data ?? []).map((d: any) => d.preference),
    reveals: (revealsRes.data ?? []).map((r: any) => r.content),
  };
}

// ─── Update profile fields ──────────────────────────────────
export async function updateProfileFields(
  userId: string,
  fields: {
    name?: string;
    pronouns?: string | null;
    profession?: string | null;
    life_stage?: string | null;
    friendship_style?: string | null;
    is_new_to_city?: boolean;
    gender?: "male" | "female" | "nonbinary";
    personality_type?: string | null;
    preferred_age_min?: number | null;
    preferred_age_max?: number | null;
    communication_style?: string | null;
    kids?: string | null;
    relationship_status?: string | null;
    work_style?: string | null;
    hidden_emojis?: string[];
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

// ─── Replace emojis (upsert new + delete stale) ─────────────
export async function updateEmojis(
  userId: string,
  emojis: string[]
): Promise<{ error: string | null }> {
  // Upsert new emojis first — if this fails, old emojis remain intact
  if (emojis.length > 0) {
    const { error: upsertError } = await supabase
      .from("profile_emojis")
      .upsert(
        emojis.map((emoji, i) => ({
          user_id: userId,
          emoji,
          position: i + 1,
        })),
        { onConflict: "user_id,position" }
      );

    if (upsertError) return { error: upsertError.message };
  }

  // Delete any extra positions beyond the new set
  const { error: deleteError } = await supabase
    .from("profile_emojis")
    .delete()
    .eq("user_id", userId)
    .gt("position", emojis.length);

  if (deleteError) return { error: deleteError.message };

  // Update cooldown timestamp
  const { error: cooldownError } = await supabase
    .from("profiles")
    .update({ emoji_last_edited_at: new Date().toISOString() })
    .eq("id", userId);

  if (cooldownError) {
    logError(cooldownError, { screen: "ProfileService", context: "emoji_cooldown_update" });
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

// ─── Replace reveals (delete all + re-insert) ───────────────
export async function updateReveals(
  userId: string,
  reveals: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_reveals")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  // Only insert non-empty reveals
  const nonEmpty = reveals.filter((r) => r.trim().length > 0);
  if (nonEmpty.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_reveals")
      .insert(nonEmpty.map((content, i) => ({
        user_id: userId,
        content: content.trim(),
        position: i + 1,
      })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Replace availability (delete all + re-insert) ──────────
export async function updateAvailability(
  userId: string,
  slots: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_availability")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  if (slots.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_availability")
      .insert(slots.map((slot) => ({ user_id: userId, slot })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Replace pets (delete all + re-insert) ──────────────────
export async function updatePets(
  userId: string,
  pets: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_pets")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  if (pets.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_pets")
      .insert(pets.map((pet) => ({ user_id: userId, pet })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Replace dietary preferences (delete all + re-insert) ───
export async function updateDietary(
  userId: string,
  preferences: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_dietary")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  if (preferences.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_dietary")
      .insert(preferences.map((preference) => ({ user_id: userId, preference })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Update languages ────────────────────────────────────────
export async function updateLanguages(
  userId: string,
  languages: string[]
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase
    .from("profile_languages")
    .delete()
    .eq("user_id", userId);

  if (deleteError) return { error: deleteError.message };

  if (languages.length > 0) {
    const { error: insertError } = await supabase
      .from("profile_languages")
      .insert(languages.map((language) => ({ user_id: userId, language })));

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

// ─── Add a photo ─────────────────────────────────────────────
export async function addPhoto(
  userId: string,
  localUri: string,
  position: number,
  isPrimary: boolean = false
): Promise<{ url: string | null; error: string | null }> {
  // Compress + validate size + face detection (if primary) + content moderation
  let prepared: { uri: string; base64: string };
  try {
    prepared = await preparePhoto(localUri, isPrimary);
  } catch (err: any) {
    logError(err, { screen: "ProfileService", context: "add_photo_prepare" });
    return { url: null, error: err.message };
  }

  const path = `${userId}/${Date.now()}_${position}.jpg`;

  // decode base64 → ArrayBuffer (official Supabase RN approach)
  const { error: uploadError } = await supabase.storage
    .from("profile-photos")
    .upload(path, decode(prepared.base64), { contentType: "image/jpeg" });

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
      is_primary: isPrimary,
    });

  if (insertError) return { url: null, error: insertError.message };

  return { url: urlData.publicUrl, error: null };
}

// ─── Delete account (photos from storage + profile cascade) ──
export async function deleteAccount(
  userId: string
): Promise<{ error: string | null }> {
  // 1. Fetch all photos so we can clean up storage files
  const { data: photos } = await supabase
    .from("profile_photos")
    .select("url")
    .eq("user_id", userId);

  // 2. Delete photo files from Supabase Storage
  if (photos && photos.length > 0) {
    const filePaths: string[] = [];
    for (const photo of photos) {
      try {
        const url = new URL(photo.url);
        const pathMatch = url.pathname.match(/\/profile-photos\/(.+)/);
        if (pathMatch) filePaths.push(pathMatch[1]);
      } catch {
        // Invalid URL — skip
      }
    }
    if (filePaths.length > 0) {
      await supabase.storage.from("profile-photos").remove(filePaths);
    }
  }

  // 3. Delete profile + auth user via security-definer RPC
  //    (cascades: emojis, photos, interests, reveals, availability, pets,
  //     dietary, swipes, matches, messages, blocks, reports)
  const { error } = await supabase.rpc("delete_own_account");

  if (error) return { error: error.message };

  return { error: null };
}

// ─── Remove a photo ──────────────────────────────────────────
export async function removePhoto(
  photoId: string,
  photoUrl: string,
  userId?: string
): Promise<{ error: string | null }> {
  // Delete from storage (extract path from URL)
  try {
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/profile-photos\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from("profile-photos").remove([pathMatch[1]]);
    }
  } catch (err: any) {
    // Storage delete failed — continue with DB delete
    logError(err, { screen: "ProfileService", context: "remove_photo_storage" });
  }

  const { error } = await supabase
    .from("profile_photos")
    .delete()
    .eq("id", photoId);

  if (error) return { error: error.message };

  // If userId provided, reassign primary if needed
  if (userId) {
    const { data: remaining } = await supabase
      .from("profile_photos")
      .select("id, is_primary")
      .eq("user_id", userId)
      .order("position");

    if (remaining?.length && !remaining.some((p: any) => p.is_primary)) {
      await supabase.from("profile_photos")
        .update({ is_primary: true })
        .eq("id", remaining[0].id);
    }
  }

  return { error: null };
}

// ─── Set a photo as primary ─────────────────────────────────
export async function setMainPhoto(
  userId: string,
  photoId: string
): Promise<{ error: string | null }> {
  // Set the new primary FIRST — if the second step fails, we have two primaries
  // (queries pick first by position) rather than zero primaries
  const { error: setError } = await supabase
    .from("profile_photos")
    .update({ is_primary: true })
    .eq("id", photoId);

  if (setError) return { error: setError.message };

  // Clear is_primary on all OTHER user photos
  const { error: clearError } = await supabase
    .from("profile_photos")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .neq("id", photoId);

  if (clearError) return { error: clearError.message };

  return { error: null };
}
