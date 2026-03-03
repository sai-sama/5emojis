import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { logError } from "./error-logger";

export interface WellnessTip {
  tip: string;
  emoji: string;
}

const DISMISS_KEY_PREFIX = "tip_dismissed_";
const CACHE_KEY = "wellness_tip_cache";

// ─── Static fallbacks (used when Edge Function hasn't run yet) ──────
const STATIC_TIPS: WellnessTip[] = [
  { tip: "Take 3 deep breaths before opening your next app. Your nervous system will thank you.", emoji: "🫁" },
  { tip: "Text a friend you haven't talked to in a while — even just an emoji counts.", emoji: "💬" },
  { tip: "Drink a glass of water right now. Hydration is self-care.", emoji: "💧" },
  { tip: "Put your phone down 30 min before bed tonight. Your sleep quality will improve so much.", emoji: "😴" },
  { tip: "Write down one thing you're grateful for today. It rewires your brain for positivity.", emoji: "✨" },
  { tip: "It's okay to say no to plans when you need recharge time. Boundaries are healthy.", emoji: "🛡️" },
  { tip: "Go for a 10-minute walk outside. Movement + fresh air = instant mood boost.", emoji: "🚶" },
];

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun...6=Sat
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}

/** Check if user already dismissed today's tip */
export async function isTipDismissedToday(): Promise<boolean> {
  const val = await AsyncStorage.getItem(DISMISS_KEY_PREFIX + getTodayKey());
  return val === "1";
}

/** Mark today's tip as dismissed */
export async function dismissTodaysTip(): Promise<void> {
  await AsyncStorage.setItem(DISMISS_KEY_PREFIX + getTodayKey(), "1");
  // Clean up old dismiss keys (older than 7 days)
  const keys = await AsyncStorage.getAllKeys();
  const now = Date.now();
  for (const key of keys) {
    if (key.startsWith(DISMISS_KEY_PREFIX) && key !== DISMISS_KEY_PREFIX + getTodayKey()) {
      const dateStr = key.replace(DISMISS_KEY_PREFIX, "");
      const d = new Date(dateStr);
      if (now - d.getTime() > 7 * 24 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(key);
      }
    }
  }
}

/** Fetch today's tip: cache → Supabase → static fallback */
export async function getTodaysTip(): Promise<WellnessTip | null> {
  // Already dismissed?
  try {
    if (await isTipDismissedToday()) return null;
  } catch (err: any) {
    logError(err, { screen: "WellnessTips", context: "check_tip_dismissed" });
  }

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { date, tip } = JSON.parse(cached);
      if (date === getTodayKey()) return tip as WellnessTip;
    }
  } catch (err: any) {
    logError(err, { screen: "WellnessTips", context: "read_tip_cache" });
  }

  // Fetch from Supabase
  try {
    const weekStart = getWeekStart();
    const dow = getDayOfWeek();
    const { data, error } = await supabase
      .from("wellness_tips")
      .select("tip, emoji")
      .eq("week_start", weekStart)
      .eq("day_of_week", dow)
      .limit(1)
      .single();

    if (!error && data) {
      const row = data as unknown as { tip: string; emoji: string };
      const tip: WellnessTip = { tip: row.tip, emoji: row.emoji };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayKey(), tip }));
      return tip;
    }
  } catch (err: any) {
    logError(err, { screen: "WellnessTips", context: "fetch_tip_from_supabase" });
  }

  // Static fallback — always works
  return STATIC_TIPS[getDayOfWeek()];
}
