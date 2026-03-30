import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { logError } from "./error-logger";

// DB row type (not yet in auto-generated Supabase types — new migration)
type StreakRow = {
  match_id: string;
  current_streak: number;
  longest_streak: number;
  last_user1_msg_date: string | null;
  last_user2_msg_date: string | null;
  last_streak_date: string | null;
  updated_at: string;
};

// ─── Types ──────────────────────────────────────────────────
export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  /** Whether the current user has messaged today */
  userMessagedToday: boolean;
  /** Whether the other user has messaged today */
  otherMessagedToday: boolean;
};

export type DailySpark = {
  question: string;
  emoji: string;
};

// ─── Streak tier badges ─────────────────────────────────────
export function getStreakBadge(streak: number): { emoji: string; label: string; color: string } | null {
  if (streak >= 30) return { emoji: "💎", label: `${streak}d`, color: "#60A5FA" };
  if (streak >= 14) return { emoji: "🔥", label: `${streak}d`, color: "#F97316" };
  if (streak >= 7)  return { emoji: "⚡", label: `${streak}d`, color: "#FBBF24" };
  if (streak >= 3)  return { emoji: "🔥", label: `${streak}d`, color: "#F97316" };
  return null;
}

// ─── Get today's date string (YYYY-MM-DD, local timezone) ───
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Fetch streak for a match ───────────────────────────────
export async function getStreak(
  matchId: string,
  currentUserId: string,
  user1Id: string
): Promise<StreakInfo> {
  const { data, error } = await (supabase
    .from("friendship_streaks" as any)
    .select("*")
    .eq("match_id", matchId)
    .single() as unknown as Promise<{ data: StreakRow | null; error: any }>);

  if (error || !data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      userMessagedToday: false,
      otherMessagedToday: false,
    };
  }

  const today = todayStr();
  const isUser1 = currentUserId === user1Id;
  const userMsgDate = isUser1 ? data.last_user1_msg_date : data.last_user2_msg_date;
  const otherMsgDate = isUser1 ? data.last_user2_msg_date : data.last_user1_msg_date;

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastStreakDate: data.last_streak_date,
    userMessagedToday: userMsgDate === today,
    otherMessagedToday: otherMsgDate === today,
  };
}

// ─── Record a message and update streak ─────────────────────
// Called after sending a message (text or icebreaker).
// Upserts the streak row and recalculates streak count.
export async function recordMessageForStreak(
  matchId: string,
  senderId: string,
  user1Id: string
): Promise<StreakInfo> {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const isUser1 = senderId === user1Id;

  // Fetch existing streak
  const { data: existing } = await (supabase
    .from("friendship_streaks" as any)
    .select("*")
    .eq("match_id", matchId)
    .single() as unknown as Promise<{ data: StreakRow | null; error: any }>);

  if (!existing) {
    // First message in this match — create streak row
    const newRow = {
      match_id: matchId,
      current_streak: 0,
      longest_streak: 0,
      last_user1_msg_date: isUser1 ? today : null,
      last_user2_msg_date: isUser1 ? null : today,
      last_streak_date: null,
    };

    await (supabase as any).from("friendship_streaks").insert(newRow);

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      userMessagedToday: true,
      otherMessagedToday: false,
    };
  }

  // Update sender's last message date
  const updateField = isUser1 ? "last_user1_msg_date" : "last_user2_msg_date";
  const otherField = isUser1 ? "last_user2_msg_date" : "last_user1_msg_date";

  const updates: Record<string, any> = {
    [updateField]: today,
    updated_at: new Date().toISOString(),
  };

  // Check if both users have now messaged today
  const otherMsgDate = existing[otherField];
  const bothMessagedToday = otherMsgDate === today;

  if (bothMessagedToday && existing.last_streak_date !== today) {
    // Both messaged today and we haven't counted today yet — increment streak
    const wasActive = existing.last_streak_date === yesterday || existing.last_streak_date === today;
    const newStreak = wasActive ? existing.current_streak + 1 : 1;
    updates.current_streak = newStreak;
    updates.longest_streak = Math.max(newStreak, existing.longest_streak);
    updates.last_streak_date = today;
  }

  const { error } = await (supabase as any)
    .from("friendship_streaks")
    .update(updates)
    .eq("match_id", matchId);

  if (error) {
    logError(new Error(error.message), { context: "streak_update" });
  }

  return {
    currentStreak: updates.current_streak ?? existing.current_streak,
    longestStreak: updates.longest_streak ?? existing.longest_streak,
    lastStreakDate: updates.last_streak_date ?? existing.last_streak_date,
    userMessagedToday: true,
    otherMessagedToday: bothMessagedToday,
  };
}

// ─── Batch fetch streaks for all matches ────────────────────
// Used on the vibes screen to show streak badges on match cards.
export async function getStreaksForMatches(
  matchIds: string[]
): Promise<Map<string, number>> {
  if (matchIds.length === 0) return new Map();

  type StreakSummary = Pick<StreakRow, "match_id" | "current_streak" | "last_streak_date">;
  const { data, error } = await (supabase
    .from("friendship_streaks" as any)
    .select("match_id, current_streak, last_streak_date")
    .in("match_id", matchIds) as unknown as Promise<{ data: StreakSummary[] | null; error: any }>);

  if (error || !data) return new Map();

  const today = todayStr();
  const yesterday = yesterdayStr();
  const result = new Map<string, number>();

  for (const row of data) {
    // Only show streak if it's still active (messaged today or yesterday)
    if (row.last_streak_date === today || row.last_streak_date === yesterday) {
      if (row.current_streak >= 3) {
        result.set(row.match_id, row.current_streak);
      }
    }
  }

  return result;
}

// ─── Daily Spark ────────────────────────────────────────────
// 90-question static pool — rotates by day-of-year so users get
// a fresh question every day for 3 months before any repeats.
// No AI tokens, no Supabase calls.

const SPARKS: DailySpark[] = [
  // ─── Food & Drink ─────────────────────────────────────────
  { question: "What's your comfort food when you've had a long day?", emoji: "🍕" },
  { question: "Best meal you've had this month?", emoji: "🍽️" },
  { question: "Coffee, tea, or something else entirely?", emoji: "☕" },
  { question: "What's a dish you could eat every day and never get bored?", emoji: "🍜" },
  { question: "Cooking at home or eating out — what's your vibe?", emoji: "👩‍🍳" },
  { question: "What's the most underrated snack of all time?", emoji: "🍿" },
  { question: "If you opened a restaurant, what would you serve?", emoji: "🧑‍🍳" },
  { question: "What food reminds you of home?", emoji: "🏠" },
  { question: "Sweet tooth or savory person?", emoji: "🍩" },
  { question: "What's a food you hated as a kid but love now?", emoji: "🥦" },

  // ─── Travel & Adventure ───────────────────────────────────
  { question: "If you could teleport anywhere right now, where would you go?", emoji: "🌍" },
  { question: "Beach vacation or mountain getaway?", emoji: "🏖️" },
  { question: "What's the last place you traveled to?", emoji: "✈️" },
  { question: "One country you're dying to visit?", emoji: "🗺️" },
  { question: "Road trip or fly? What's your travel style?", emoji: "🚗" },
  { question: "Most beautiful place you've ever been?", emoji: "🌅" },
  { question: "Do you prefer planned trips or spontaneous adventures?", emoji: "🎒" },
  { question: "What's a hidden gem in your city people should know about?", emoji: "💎" },
  { question: "Window seat or aisle?", emoji: "🪟" },
  { question: "What's on your travel bucket list this year?", emoji: "📋" },

  // ─── Music & Entertainment ────────────────────────────────
  { question: "What song is stuck in your head right now?", emoji: "🎵" },
  { question: "Last show you binged?", emoji: "📺" },
  { question: "What's a movie you can rewatch forever?", emoji: "🎬" },
  { question: "Concerts or festivals — which do you prefer?", emoji: "🎤" },
  { question: "What genre of music matches your current mood?", emoji: "🎧" },
  { question: "If your life had a theme song, what would it be?", emoji: "🎶" },
  { question: "What's a show you think everyone should watch?", emoji: "⭐" },
  { question: "Podcasts or music during commutes?", emoji: "🎙️" },
  { question: "What artist are you seeing next (or want to)?", emoji: "🎪" },
  { question: "Guilty pleasure song you'd never skip?", emoji: "😅" },

  // ─── Hobbies & Interests ──────────────────────────────────
  { question: "What's a hobby you've always wanted to try?", emoji: "🎨" },
  { question: "How do you spend a lazy Sunday?", emoji: "☀️" },
  { question: "Are you a morning person or a night owl?", emoji: "🦉" },
  { question: "What's something you're weirdly good at?", emoji: "🏆" },
  { question: "Do you have a creative outlet? What is it?", emoji: "✏️" },
  { question: "What skill would you learn if time wasn't an issue?", emoji: "📚" },
  { question: "Indoor activities or outdoor adventures?", emoji: "🏕️" },
  { question: "What's the last thing you did for fun?", emoji: "🎉" },
  { question: "Do you collect anything?", emoji: "🧸" },
  { question: "What's a hobby that surprised you by how much you liked it?", emoji: "🤯" },

  // ─── Hypotheticals & Fun ──────────────────────────────────
  { question: "If you won the lottery tomorrow, first thing you'd do?", emoji: "💰" },
  { question: "You can only eat one cuisine forever — which one?", emoji: "🤔" },
  { question: "If you could have any superpower, what would it be?", emoji: "🦸" },
  { question: "Would you rather time travel to the past or future?", emoji: "⏰" },
  { question: "If you could master any instrument overnight, which one?", emoji: "🎸" },
  { question: "Zombie apocalypse — what's your survival strategy?", emoji: "🧟" },
  { question: "If you could live in any fictional world, which one?", emoji: "🪄" },
  { question: "You get a one-way ticket to Mars — are you going?", emoji: "🚀" },
  { question: "If animals could talk, which would be the rudest?", emoji: "🐈" },
  { question: "Would you rather always be 10 minutes late or 20 minutes early?", emoji: "⏳" },

  // ─── Memories & Nostalgia ─────────────────────────────────
  { question: "What's a childhood memory that always makes you smile?", emoji: "👶" },
  { question: "What was your dream job when you were 10?", emoji: "💭" },
  { question: "What's the best gift you've ever received?", emoji: "🎁" },
  { question: "Song that instantly takes you back to high school?", emoji: "🎒" },
  { question: "What's a tradition you had growing up that you still love?", emoji: "🎄" },
  { question: "First concert you ever went to?", emoji: "🎫" },
  { question: "What's a lesson you learned the hard way?", emoji: "📖" },
  { question: "What did you want to be famous for as a kid?", emoji: "🌟" },
  { question: "Favorite cartoon or show from when you were little?", emoji: "📺" },
  { question: "What's the most spontaneous thing you've ever done?", emoji: "⚡" },

  // ─── Friendship & Social ──────────────────────────────────
  { question: "What's your love language in friendships?", emoji: "💜" },
  { question: "Group hangout or one-on-one catch-up?", emoji: "👯" },
  { question: "What makes someone a great friend to you?", emoji: "🤝" },
  { question: "Best friend date idea that doesn't cost money?", emoji: "🆓" },
  { question: "Do you have a friendship that started in the most random way?", emoji: "🎲" },
  { question: "What's the best advice a friend ever gave you?", emoji: "💡" },
  { question: "How do you recharge after a busy week?", emoji: "🔋" },
  { question: "Text, call, or voice note — how do you keep in touch?", emoji: "📱" },
  { question: "What's your go-to hangout spot?", emoji: "📍" },
  { question: "Are you the planner or the 'I'm down for whatever' friend?", emoji: "📝" },

  // ─── Preferences & Opinions ───────────────────────────────
  { question: "Cats or dogs — and why?", emoji: "🐾" },
  { question: "What's a hot take you stand by?", emoji: "🔥" },
  { question: "Early bird workout or late night gym session?", emoji: "💪" },
  { question: "Rain or sunshine — which puts you in a better mood?", emoji: "🌧️" },
  { question: "What's the best season and why is it fall?", emoji: "🍂" },
  { question: "City life or countryside — where do you see yourself?", emoji: "🏙️" },
  { question: "Books or audiobooks?", emoji: "📖" },
  { question: "What's something everyone loves but you just don't get?", emoji: "🤷" },
  { question: "Minimalist or maximalist — what's your space like?", emoji: "🏠" },
  { question: "What's a small luxury you refuse to give up?", emoji: "✨" },

  // ─── Dreams & Goals ───────────────────────────────────────
  { question: "What's something you want to accomplish this year?", emoji: "🎯" },
  { question: "If money wasn't a thing, how would you spend your days?", emoji: "🌈" },
  { question: "What's a fear you'd love to conquer?", emoji: "🦁" },
  { question: "Where do you see yourself in 5 years?", emoji: "🔮" },
  { question: "What's something on your bucket list you haven't told anyone?", emoji: "🤫" },
  { question: "If you could start a business, what would it be?", emoji: "💼" },
  { question: "What's a new habit you're trying to build?", emoji: "🌱" },
  { question: "What's the best thing that happened to you this week?", emoji: "✨" },
  { question: "If you could have dinner with anyone, who would it be?", emoji: "🍷" },
  { question: "What's something small that made you smile today?", emoji: "😊" },
];

// Deterministic pick based on day-of-year — cycles every 90 days
function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getTodaysSpark(): DailySpark {
  return SPARKS[dayOfYear() % SPARKS.length];
}

// ─── Check if a spark has been dismissed for a match today ──
export async function isSparkDismissed(matchId: string): Promise<boolean> {
  try {
    const key = `spark_dismissed_${matchId}`;
    const val = await AsyncStorage.getItem(key);
    return val === todayStr();
  } catch {
    return false;
  }
}

export async function dismissSpark(matchId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`spark_dismissed_${matchId}`, todayStr());
  } catch {}
}
