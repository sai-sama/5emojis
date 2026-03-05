import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchAppStats,
  fetchErrorLogs,
  fetchReports,
  updateReportStatus,
  type AppStats,
  type ErrorLog,
  type Report,
} from "../../lib/admin-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type Tab = "stats" | "errors" | "reports";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("stats");
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const loadData = useCallback(async () => {
    const [s, e, r] = await Promise.all([
      fetchAppStats(),
      fetchErrorLogs(0, 50),
      fetchReports(),
    ]);
    setStats(s);
    setErrors(e);
    setReports(r);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleReportAction = async (
    reportId: string,
    action: "reviewed" | "actioned" | "dismissed"
  ) => {
    const { error } = await updateReportStatus(reportId, action);
    if (error) {
      Alert.alert("Error", error);
    } else {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      );
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["stats", "errors", "reports"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "stats" ? "Dashboard" : t === "errors" ? `Errors${stats ? ` (${stats.errorsToday})` : ""}` : `Reports${stats ? ` (${stats.pendingReports})` : ""}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ═══ STATS TAB ═══ */}
        {tab === "stats" && stats && (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Text style={styles.sectionTitle}>App Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Users" value={stats.totalUsers} icon="people" color="#6C5CE7" />
              <StatCard label="Matches" value={stats.totalMatches} icon="heart" color="#E17055" />
              <StatCard label="Swipes" value={stats.totalSwipes} icon="swap-horizontal" color="#00B894" />
              <StatCard label="Messages" value={stats.totalMessages} icon="chatbubble" color="#0984E3" />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Health</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Errors Today"
                value={stats.errorsToday}
                icon="warning"
                color={stats.errorsToday > 0 ? "#D63031" : "#00B894"}
              />
              <StatCard
                label="Errors (7d)"
                value={stats.errorsThisWeek}
                icon="trending-up"
                color={stats.errorsThisWeek > 10 ? "#D63031" : "#FDCB6E"}
              />
              <StatCard
                label="Pending Reports"
                value={stats.pendingReports}
                icon="flag"
                color={stats.pendingReports > 0 ? "#E17055" : "#00B894"}
              />
            </View>
          </View>
        )}

        {/* ═══ ERRORS TAB ═══ */}
        {tab === "errors" && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {errors.length === 0 && (
              <Text style={styles.emptyText}>No errors logged</Text>
            )}
            {errors.map((err) => (
              <View key={err.id} style={styles.errorCard}>
                <View style={styles.errorHeader}>
                  <View style={styles.errorBadge}>
                    <Text style={styles.errorBadgeText}>
                      {err.platform ?? "unknown"}
                    </Text>
                  </View>
                  {err.screen && (
                    <Text style={styles.errorScreen}>{err.screen}</Text>
                  )}
                  <Text style={styles.errorTime}>{formatTime(err.created_at)}</Text>
                </View>
                <Text style={styles.errorMessage} numberOfLines={3}>
                  {err.error_message}
                </Text>
                {err.extra && (
                  <Text style={styles.errorExtra} numberOfLines={1}>
                    {JSON.stringify(err.extra)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ═══ REPORTS TAB ═══ */}
        {tab === "reports" && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {reports.length === 0 && (
              <Text style={styles.emptyText}>No reports</Text>
            )}
            {reports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      report.status === "pending" && { backgroundColor: "#FFEAA7" },
                      report.status === "actioned" && { backgroundColor: "#55EFC4" },
                      report.status === "dismissed" && { backgroundColor: "#DFE6E9" },
                      report.status === "reviewed" && { backgroundColor: "#74B9FF" },
                    ]}
                  >
                    <Text style={styles.statusText}>{report.status}</Text>
                  </View>
                  <Text style={styles.errorTime}>{formatTime(report.created_at)}</Text>
                </View>
                <Text style={styles.reportReason}>{report.reason}</Text>
                <Text style={styles.reportNames}>
                  {report.reporter_name} reported {report.reported_name}
                </Text>
                {report.details && (
                  <Text style={styles.reportDetails} numberOfLines={2}>
                    {report.details}
                  </Text>
                )}
                {report.status === "pending" && (
                  <View style={styles.reportActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#00B894" }]}
                      onPress={() => handleReportAction(report.id, "actioned")}
                    >
                      <Text style={styles.actionText}>Action</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#636E72" }]}
                      onPress={() => handleReportAction(report.id, "dismissed")}
                    >
                      <Text style={styles.actionText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card Component ────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#FFF",
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },

  // Error cards
  errorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBadge: {
    backgroundColor: "#DFE6E9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  errorBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  errorScreen: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
    flex: 1,
  },
  errorTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },
  errorMessage: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.text,
    lineHeight: 18,
  },
  errorExtra: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },

  // Report cards
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
    textTransform: "capitalize",
  },
  reportReason: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
    textTransform: "capitalize",
  },
  reportNames: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
  reportDetails: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  reportActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
});
