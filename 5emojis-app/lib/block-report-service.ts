import { supabase } from "./supabase";

export const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "spam", label: "Spam or Scam" },
  { value: "fake_profile", label: "Fake Profile" },
  { value: "underage", label: "May Be Under 18" },
  { value: "other", label: "Other" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

/** Block a user. Also removes any existing match between the two users. */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ error: string | null }> {
  // Insert block
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });

  if (error) {
    if (error.code === "23505") return { error: null }; // already blocked
    return { error: error.message };
  }

  // Delete any match between them (canonical ordering)
  const [uid1, uid2] =
    blockerId < blockedId ? [blockerId, blockedId] : [blockedId, blockerId];

  await supabase
    .from("matches")
    .delete()
    .eq("user1_id", uid1)
    .eq("user2_id", uid2);

  return { error: null };
}

/** Unblock a user. */
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  return { error: error?.message ?? null };
}

/** Report a user. */
export async function reportUser(
  reporterId: string,
  reportedId: string,
  reason: ReportReason,
  details?: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    details: details?.trim() || null,
    status: "pending",
  });

  return { error: error?.message ?? null };
}
