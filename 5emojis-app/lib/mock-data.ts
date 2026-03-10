import { supabase } from "./supabase";

// Deterministic UUIDs for mock profiles (matches seed_mock_profiles.sql)
export const MOCK_USER_IDS = [
  "00000000-0000-4000-a000-000000000001",
  "00000000-0000-4000-a000-000000000002",
  "00000000-0000-4000-a000-000000000003",
  "00000000-0000-4000-a000-000000000004",
  "00000000-0000-4000-a000-000000000005",
  "00000000-0000-4000-a000-000000000006",
  "00000000-0000-4000-a000-000000000007",
  "00000000-0000-4000-a000-000000000008",
  "00000000-0000-4000-a000-000000000009",
  "00000000-0000-4000-a000-000000000010",
  "00000000-0000-4000-a000-000000000011",
  "00000000-0000-4000-a000-000000000012",
  "00000000-0000-4000-a000-000000000013",
  "00000000-0000-4000-a000-000000000014",
  "00000000-0000-4000-a000-000000000015",
  "00000000-0000-4000-a000-000000000016",
  "00000000-0000-4000-a000-000000000017",
  "00000000-0000-4000-a000-000000000018",
  "00000000-0000-4000-a000-000000000019",
  "00000000-0000-4000-a000-000000000020",
  "00000000-0000-4000-a000-000000000021",
  "00000000-0000-4000-a000-000000000022",
  "00000000-0000-4000-a000-000000000023",
  "00000000-0000-4000-a000-000000000024",
  "00000000-0000-4000-a000-000000000025",
] as const;

/**
 * Reset mock data for the current user:
 * 1. Deletes all messages/matches/swipes with mock profiles
 * 2. Moves mock profiles to user's location
 * 3. Pre-seeds right swipes from mock profiles → user (instant matches on swipe right)
 */
export async function resetMockData(
  userId: string
): Promise<{ error: string | null; result: any }> {
  const { data, error } = await supabase.rpc("reset_mock_data", {
    requesting_user_id: userId,
  });

  if (error) return { error: error.message, result: null };

  // Reset daily super like count so the user can keep testing
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("daily_swipe_counts")
    .update({ super_like_count: 0, right_count: 0 })
    .eq("user_id", userId)
    .eq("swipe_date", today);

  return { error: null, result: data };
}
