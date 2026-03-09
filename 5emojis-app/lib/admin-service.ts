import { supabase } from "./supabase";
import { logError } from "./error-logger";

// ─── Types ──────────────────────────────────────────────────
export type ErrorLog = {
  id: string;
  user_id: string | null;
  error_message: string;
  error_stack: string | null;
  screen: string | null;
  platform: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  // Joined fields
  reporter_name?: string;
  reported_name?: string;
};

export type AppStats = {
  totalUsers: number;
  totalMatches: number;
  totalSwipes: number;
  totalMessages: number;
  errorsToday: number;
  errorsThisWeek: number;
  pendingReports: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  suspendedUsers: number;
  activeChats: number;
};

export type AdminUser = {
  id: string;
  name: string;
  dob: string;
  gender: string;
  city: string;
  profession: string | null;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  is_admin: boolean;
  created_at: string;
  report_count?: number;
};

// ─── App Stats ──────────────────────────────────────────────
export async function fetchAppStats(): Promise<AppStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    users, matches, swipes, messages,
    errorsToday, errorsWeek, pendingReports,
    newToday, newWeek, suspended, activeChats,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("swipes").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("error_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", true),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .not("icebreaker_question_id", "is", null),
  ]);

  return {
    totalUsers: users.count ?? 0,
    totalMatches: matches.count ?? 0,
    totalSwipes: swipes.count ?? 0,
    totalMessages: messages.count ?? 0,
    errorsToday: errorsToday.count ?? 0,
    errorsThisWeek: errorsWeek.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
    newUsersToday: newToday.count ?? 0,
    newUsersThisWeek: newWeek.count ?? 0,
    suspendedUsers: suspended.count ?? 0,
    activeChats: activeChats.count ?? 0,
  };
}

// ─── Error Logs ─────────────────────────────────────────────
export async function fetchErrorLogs(
  page: number = 0,
  limit: number = 50
): Promise<ErrorLog[]> {
  const from = page * limit;
  const { data, error } = await supabase
    .from("error_logs")
    .select("id, user_id, error_message, error_stack, screen, platform, extra, created_at")
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    logError(error, { screen: "AdminService", context: "fetch_error_logs" });
    return [];
  }
  return data ?? [];
}

// ─── Reports ────────────────────────────────────────────────
export async function fetchReports(
  status?: string
): Promise<Report[]> {
  let query = supabase
    .from("reports")
    .select(`
      id, reporter_id, reported_id, reason, details, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(name),
      reported:profiles!reports_reported_id_fkey(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { screen: "AdminService", context: "fetch_reports" });
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    reporter_id: r.reporter_id,
    reported_id: r.reported_id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    created_at: r.created_at,
    reporter_name: r.reporter?.name ?? "Unknown",
    reported_name: r.reported?.name ?? "Unknown",
  }));
}

// ─── Update report ──────────────────────────────────────────
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "reviewed" | "actioned" | "dismissed"
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    logError(error, { screen: "AdminService", context: "update_report_status" });
    return { error: error.message };
  }
  return { error: null };
}

// ─── Users List ────────────────────────────────────────────
export async function fetchUsers(
  page: number = 0,
  limit: number = 50,
  search?: string
): Promise<AdminUser[]> {
  const from = page * limit;
  let query = supabase
    .from("profiles")
    .select("id, name, dob, gender, city, profession, is_suspended, suspended_until, suspension_reason, is_admin, created_at")
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    logError(error, { screen: "AdminService", context: "fetch_users" });
    return [];
  }
  return (data ?? []) as AdminUser[];
}

// ─── Suspend / Unsuspend user ──────────────────────────────
export async function suspendUser(
  userId: string,
  reason: string,
  durationDays: number
): Promise<{ error: string | null }> {
  const until = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_until: until,
      suspension_reason: reason,
    })
    .eq("id", userId);

  if (error) {
    logError(error, { screen: "AdminService", context: "suspend_user" });
    return { error: error.message };
  }
  return { error: null };
}

export async function unsuspendUser(
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_until: null,
      suspension_reason: null,
    })
    .eq("id", userId);

  if (error) {
    logError(error, { screen: "AdminService", context: "unsuspend_user" });
    return { error: error.message };
  }
  return { error: null };
}

// ─── City Stats (users per city) ────────────────────────────
export type CityStats = {
  city: string;
  count: number;
};

export async function fetchCityStats(): Promise<CityStats[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("city");

  if (error) {
    logError(error, { screen: "AdminService", context: "fetch_city_stats" });
    return [];
  }

  // Aggregate counts per city
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const city = row.city || "Unknown";
    counts[city] = (counts[city] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Premium Gate Settings ──────────────────────────────────
export type PremiumGateSettings = {
  enabled: boolean;
  mode: "global" | "per_city";
  gated_cities: string[];
};

export async function fetchPremiumGateSettings(): Promise<PremiumGateSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "premium_gate")
    .single();

  if (error || !data) {
    return { enabled: false, mode: "global", gated_cities: [] };
  }

  return data.value as PremiumGateSettings;
}

export async function updatePremiumGateSettings(
  settings: PremiumGateSettings
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("app_settings")
    .update({ value: settings, updated_at: new Date().toISOString() })
    .eq("key", "premium_gate");

  if (error) {
    logError(error, { screen: "AdminService", context: "update_premium_gate" });
    return { error: error.message };
  }
  return { error: null };
}

// ─── User detail ───────────────────────────────────────────
export async function fetchUserDetail(userId: string) {
  const [profileRes, photosRes, emojisRes, swipesRes, matchesRes, reportsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single(),
      supabase
        .from("profile_photos")
        .select("id, url, position")
        .eq("user_id", userId)
        .order("position"),
      supabase
        .from("profile_emojis")
        .select("emoji, position")
        .eq("user_id", userId)
        .order("position"),
      supabase
        .from("swipes")
        .select("id", { count: "exact", head: true })
        .eq("swiper_id", userId),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase
        .from("reports")
        .select("id, reason, status, created_at")
        .eq("reported_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    profile: profileRes.data,
    photos: photosRes.data ?? [],
    emojis: (emojisRes.data ?? []).map((e: any) => e.emoji),
    swipeCount: swipesRes.count ?? 0,
    matchCount: matchesRes.count ?? 0,
    reports: reportsRes.data ?? [],
  };
}
