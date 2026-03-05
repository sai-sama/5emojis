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
};

// ─── App Stats ──────────────────────────────────────────────
export async function fetchAppStats(): Promise<AppStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, matches, swipes, messages, errorsToday, errorsWeek, pendingReports] =
    await Promise.all([
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
    ]);

  return {
    totalUsers: users.count ?? 0,
    totalMatches: matches.count ?? 0,
    totalSwipes: swipes.count ?? 0,
    totalMessages: messages.count ?? 0,
    errorsToday: errorsToday.count ?? 0,
    errorsThisWeek: errorsWeek.count ?? 0,
    pendingReports: pendingReports.count ?? 0,
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
  status: "reviewed" | "actioned" | "dismissed"
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
