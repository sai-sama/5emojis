import { supabase } from "./supabase";
import { FREE_DAILY_RIGHT_SWIPES, PREMIUM_DAILY_SUPER_LIKES } from "./constants";
import { logError } from "./error-logger";

// ─── Types ──────────────────────────────────────────────────
export type DailySwipeCounts = {
  rightCount: number;
  superLikeCount: number;
};

// ─── Get today's swipe counts ───────────────────────────────
export async function getDailySwipeCounts(userId: string): Promise<DailySwipeCounts> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data } = await supabase
    .from("daily_swipe_counts")
    .select("right_count, super_like_count")
    .eq("user_id", userId)
    .eq("swipe_date", today)
    .single();

  return {
    rightCount: data?.right_count ?? 0,
    superLikeCount: data?.super_like_count ?? 0,
  };
}

// ─── Increment right swipe count (atomic server-side) ────────
export async function incrementRightSwipe(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_right_swipe", { p_user_id: userId });
    if (error) throw error;
  } catch (err: any) {
    logError(err, { screen: "SwipeLimits", context: "increment_right_swipe" });
  }
}

// ─── Increment super like count (atomic server-side) ─────────
export async function incrementSuperLike(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_super_like_count", { p_user_id: userId });
    if (error) throw error;
  } catch (err: any) {
    logError(err, { screen: "SwipeLimits", context: "increment_super_like" });
  }
}

// ─── Check if user can swipe right ──────────────────────────
export function canSwipeRight(counts: DailySwipeCounts, isPremium: boolean): boolean {
  if (isPremium) return true;
  return counts.rightCount < FREE_DAILY_RIGHT_SWIPES;
}

// ─── Check if user can super like ───────────────────────────
export function canSuperLike(counts: DailySwipeCounts, isPremium: boolean): boolean {
  if (!isPremium) return false;
  return counts.superLikeCount < PREMIUM_DAILY_SUPER_LIKES;
}

// ─── Get remaining right swipes ─────────────────────────────
export function getRemainingRightSwipes(counts: DailySwipeCounts, isPremium: boolean): number | null {
  if (isPremium) return null; // unlimited
  return Math.max(0, FREE_DAILY_RIGHT_SWIPES - counts.rightCount);
}

// ─── Get remaining super likes ──────────────────────────────
export function getRemainingSuperLikes(counts: DailySwipeCounts): number {
  return Math.max(0, PREMIUM_DAILY_SUPER_LIKES - counts.superLikeCount);
}

// ─── Record a super like (just increments daily counter) ────
// The actual super-like flag lives on swipes.is_super_like (set via recordSwipe)
export async function recordSuperLike(
  senderId: string,
  _receiverId: string
): Promise<{ error: string | null }> {
  try {
    await incrementSuperLike(senderId);
    return { error: null };
  } catch (err: any) {
    logError(err, { screen: "SwipeLimits", context: "record_super_like" });
    return { error: err.message || "Failed to super like" };
  }
}
