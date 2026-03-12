import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  TextInput,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchAppStats,
  fetchErrorLogs,
  fetchReports,
  fetchUsers,
  fetchUserDetail,
  updateReportStatus,
  suspendUser,
  unsuspendUser,
  fetchUserAnalytics,
  type AppStats,
  type ErrorLog,
  type Report,
  type AdminUser,
  type UserAnalytics,
} from "../../lib/admin-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type Tab = "stats" | "users" | "errors" | "reports" | "analytics";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("stats");
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  // User detail modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState<{ userId: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDays, setSuspendDays] = useState("7");

  const loadData = useCallback(async () => {
    const [s, e, r, ua] = await Promise.all([
      fetchAppStats(),
      fetchErrorLogs(0, 50),
      fetchReports(),
      fetchUserAnalytics(),
    ]);
    setStats(s);
    setErrors(e);
    setReports(r);
    setAnalytics(ua);
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

  const handleUserSearch = async () => {
    const results = await fetchUsers(0, 100, userSearch || undefined);
    setUsers(results);
  };

  const openUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    const detail = await fetchUserDetail(userId);
    setUserDetail(detail);
    setDetailLoading(false);
  };

  const handleSuspend = async () => {
    if (!suspendModal || !suspendReason.trim()) {
      Alert.alert("Error", "Please enter a reason.");
      return;
    }
    const days = parseInt(suspendDays) || 7;
    const { error } = await suspendUser(suspendModal.userId, suspendReason.trim(), days);
    if (error) {
      Alert.alert("Error", error);
    } else {
      Alert.alert("Suspended", `${suspendModal.name} has been suspended for ${days} days.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === suspendModal.userId ? { ...u, is_suspended: true } : u
        )
      );
      if (userDetail?.profile?.id === suspendModal.userId) {
        setUserDetail((prev: any) =>
          prev ? { ...prev, profile: { ...prev.profile, is_suspended: true } } : prev
        );
      }
    }
    setSuspendModal(null);
    setSuspendReason("");
    setSuspendDays("7");
  };

  const handleUnsuspend = async (userId: string, name: string) => {
    Alert.alert(`Unsuspend ${name}?`, "This will restore their access.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unsuspend",
        onPress: async () => {
          const { error } = await unsuspendUser(userId);
          if (error) {
            Alert.alert("Error", error);
          } else {
            setUsers((prev) =>
              prev.map((u) => (u.id === userId ? { ...u, is_suspended: false } : u))
            );
            if (userDetail?.profile?.id === userId) {
              setUserDetail((prev: any) =>
                prev ? { ...prev, profile: { ...prev.profile, is_suspended: false } } : prev
              );
            }
          }
        },
      },
    ]);
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const calculateAge = (dob: string) => {
    const d = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age;
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {(["stats", "users", "errors", "reports", "analytics"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "stats"
                ? "Dashboard"
                : t === "users"
                ? `Users${stats ? ` (${stats.totalUsers})` : ""}`
                : t === "errors"
                ? `Errors${stats ? ` (${stats.errorsToday})` : ""}`
                : t === "reports"
                ? `Reports${stats ? ` (${stats.pendingReports})` : ""}`
                : "Analytics"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* STATS TAB */}
        {tab === "stats" && stats && (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Text style={styles.sectionTitle}>App Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Users"
                value={stats.totalUsers}
                icon="people"
                color="#6C5CE7"
                onPress={() => setTab("users")}
              />
              <StatCard label="Matches" value={stats.totalMatches} icon="heart" color="#E17055" />
              <StatCard label="Swipes" value={stats.totalSwipes} icon="swap-horizontal" color="#00B894" />
              <StatCard label="Messages" value={stats.totalMessages} icon="chatbubble" color="#0984E3" />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Growth</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="New Today"
                value={stats.newUsersToday}
                icon="person-add"
                color={stats.newUsersToday > 0 ? "#00B894" : "#636E72"}
              />
              <StatCard
                label="New (7d)"
                value={stats.newUsersThisWeek}
                icon="trending-up"
                color={stats.newUsersThisWeek > 0 ? "#0984E3" : "#636E72"}
              />
              <StatCard
                label="Active Chats"
                value={stats.activeChats}
                icon="chatbubbles"
                color="#6C5CE7"
              />
              <StatCard
                label="Suspended"
                value={stats.suspendedUsers}
                icon="ban"
                color={stats.suspendedUsers > 0 ? "#D63031" : "#00B894"}
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Health</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Errors Today"
                value={stats.errorsToday}
                icon="warning"
                color={stats.errorsToday > 0 ? "#D63031" : "#00B894"}
                onPress={() => setTab("errors")}
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
                onPress={() => setTab("reports")}
              />
            </View>
          </View>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <View style={{ marginTop: 16, gap: 12 }}>
            {/* Total count */}
            {stats && (
              <View style={styles.userCountCard}>
                <Ionicons name="people" size={22} color={COLORS.primary} />
                <Text style={styles.userCountText}>
                  {stats.totalUsers} total user{stats.totalUsers !== 1 ? "s" : ""}
                </Text>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                testID="user-search"
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search by name or email..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchInput}
                onSubmitEditing={handleUserSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleUserSearch}>
                <Ionicons name="search" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Results only shown after search */}
            {users.length === 0 && userSearch.trim().length > 0 && (
              <Text style={styles.emptyText}>No users found for "{userSearch}"</Text>
            )}
            {users.length === 0 && userSearch.trim().length === 0 && (
              <Text style={styles.emptyText}>Search for a user by name or email</Text>
            )}
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => openUserDetail(user.id)}
                activeOpacity={0.7}
              >
                <View style={styles.userCardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      {user.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                      {user.is_suspended && (
                        <View style={styles.suspendedBadge}>
                          <Text style={styles.suspendedBadgeText}>Suspended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userMeta}>
                      {calculateAge(user.dob)} · {user.gender} · {user.city}
                      {user.profession ? ` · ${user.profession}` : ""}
                    </Text>
                    <Text style={styles.userJoined}>Joined {formatDate(user.created_at)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ERRORS TAB */}
        {tab === "errors" && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {errors.length === 0 && (
              <Text style={styles.emptyText}>No errors logged</Text>
            )}
            {errors.map((err) => (
              <TouchableOpacity
                key={err.id}
                style={styles.errorCard}
                onPress={() =>
                  setExpandedErrorId(expandedErrorId === err.id ? null : err.id)
                }
                activeOpacity={0.7}
              >
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
                <Text
                  style={styles.errorMessage}
                  numberOfLines={expandedErrorId === err.id ? undefined : 3}
                >
                  {err.error_message}
                </Text>
                {expandedErrorId === err.id && err.error_stack && (
                  <View style={styles.errorStackContainer}>
                    <Text style={styles.errorStackLabel}>Stack trace:</Text>
                    <Text style={styles.errorStack}>{err.error_stack}</Text>
                  </View>
                )}
                {expandedErrorId === err.id && err.extra && (
                  <Text style={styles.errorExtra}>
                    {JSON.stringify(err.extra, null, 2)}
                  </Text>
                )}
                {expandedErrorId !== err.id && (err.error_stack || err.extra) && (
                  <Text style={styles.tapToExpand}>Tap to expand</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* REPORTS TAB */}
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
                <TouchableOpacity onPress={() => openUserDetail(report.reported_id)}>
                  <Text style={styles.reportNames}>
                    <Text style={{ color: COLORS.primary }}>{report.reporter_name}</Text>
                    {" reported "}
                    <Text style={{ color: COLORS.accent }}>{report.reported_name}</Text>
                  </Text>
                </TouchableOpacity>
                {report.details && (
                  <Text style={styles.reportDetails} numberOfLines={2}>
                    {report.details}
                  </Text>
                )}
                <View style={styles.reportActions}>
                    {report.status !== "actioned" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#00B894" }]}
                        onPress={() => handleReportAction(report.id, "actioned")}
                      >
                        <Text style={styles.actionText}>Action</Text>
                      </TouchableOpacity>
                    )}
                    {report.status !== "reviewed" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#0984E3" }]}
                        onPress={() => handleReportAction(report.id, "reviewed")}
                      >
                        <Text style={styles.actionText}>Review</Text>
                      </TouchableOpacity>
                    )}
                    {report.status !== "dismissed" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#636E72" }]}
                        onPress={() => handleReportAction(report.id, "dismissed")}
                      >
                        <Text style={styles.actionText}>Dismiss</Text>
                      </TouchableOpacity>
                    )}
                    {report.status !== "pending" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#FDCB6E" }]}
                        onPress={() => handleReportAction(report.id, "pending")}
                      >
                        <Text style={[styles.actionText, { color: "#2D3436" }]}>Reopen</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: "#D63031" }]}
                      onPress={() =>
                        setSuspendModal({
                          userId: report.reported_id,
                          name: report.reported_name ?? "User",
                        })
                      }
                    >
                      <Text style={styles.actionText}>Suspend</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            ))}
          </View>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && analytics && (
          <View style={{ marginTop: 16, gap: 16 }}>
            {/* Free vs Premium totals */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[styles.userCountCard, { flex: 1, backgroundColor: "#F0F4FF", borderColor: "#C7D2FE" }]}>
                <View>
                  <Text style={{ fontSize: 28, fontFamily: fonts.headingBold, color: COLORS.primary }}>
                    {analytics.totalFree}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: COLORS.textSecondary }}>
                    Free Users
                  </Text>
                </View>
              </View>
              <View style={[styles.userCountCard, { flex: 1, backgroundColor: "#FFF7E0", borderColor: COLORS.highlight }]}>
                <View>
                  <Text style={{ fontSize: 28, fontFamily: fonts.headingBold, color: COLORS.highlightDark }}>
                    {analytics.totalPremium}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: COLORS.textSecondary }}>
                    Premium Users
                  </Text>
                </View>
              </View>
            </View>

            {/* Conversion rate */}
            {(analytics.totalFree + analytics.totalPremium) > 0 && (
              <View style={[styles.userCountCard, { backgroundColor: "#E8F8F0", borderColor: "#A7F3D0" }]}>
                <Ionicons name="trending-up" size={20} color="#00B894" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: fonts.bodySemiBold, color: "#00B894" }}>
                    {((analytics.totalPremium / (analytics.totalFree + analytics.totalPremium)) * 100).toFixed(1)}% conversion
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 2 }}>
                    {analytics.totalPremium} of {analytics.totalFree + analytics.totalPremium} users are premium
                  </Text>
                </View>
              </View>
            )}

            {/* Users by city breakdown */}
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>Users by City</Text>
              {analytics.byCity.length === 0 && (
                <Text style={styles.emptyText}>No users yet</Text>
              )}
              {analytics.byCity.map((cs) => (
                <View key={cs.city} style={styles.cityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cityName}>{cs.city}</Text>
                    <Text style={styles.cityCount}>
                      {cs.total} user{cs.total !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={[styles.cityToggle, { backgroundColor: "#F0F4FF" }]}>
                      <Text style={[styles.cityToggleText, { color: COLORS.primary }]}>
                        {cs.free} free
                      </Text>
                    </View>
                    {cs.premium > 0 && (
                      <View style={[styles.cityToggle, { backgroundColor: "#FFF7E0" }]}>
                        <Text style={[styles.cityToggleText, { color: COLORS.highlightDark }]}>
                          {cs.premium} paid
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── User Detail Modal ──────────────────────────────── */}
      <Modal
        visible={selectedUserId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedUserId(null);
          setUserDetail(null);
        }}
      >
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setSelectedUserId(null);
                setUserDetail(null);
              }}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>User Detail</Text>
            <View style={{ width: 24 }} />
          </View>

          {detailLoading ? (
            <View style={styles.loadingCenter}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : userDetail?.profile ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
              {/* Profile header */}
              <View style={styles.detailHeader}>
                {userDetail.photos.length > 0 ? (
                  <Image
                    source={{ uri: userDetail.photos[0].url }}
                    style={styles.detailPhoto}
                  />
                ) : (
                  <View style={[styles.detailPhoto, styles.detailPhotoPlaceholder]}>
                    <Ionicons name="person" size={28} color={COLORS.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.detailName}>{userDetail.profile.name}</Text>
                    {userDetail.profile.is_admin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.detailMeta}>
                    {calculateAge(userDetail.profile.dob)} · {userDetail.profile.gender} · {userDetail.profile.city}
                  </Text>
                  {userDetail.profile.profession && (
                    <Text style={styles.detailProfession}>{userDetail.profile.profession}</Text>
                  )}
                </View>
              </View>

              {/* Status */}
              {userDetail.profile.is_suspended && (
                <View style={styles.suspensionBanner}>
                  <Ionicons name="ban" size={16} color="#D63031" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suspensionText}>
                      Suspended until {formatDate(userDetail.profile.suspended_until ?? "")}
                    </Text>
                    {userDetail.profile.suspension_reason && (
                      <Text style={styles.suspensionReason}>
                        {userDetail.profile.suspension_reason}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Emojis */}
              {userDetail.emojis.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Emojis</Text>
                  <View style={styles.emojiRow}>
                    {userDetail.emojis.map((emoji: string, i: number) => (
                      <Text key={i} style={styles.detailEmoji}>{emoji}</Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Stats */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Activity</Text>
                <View style={styles.detailStatsRow}>
                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>{userDetail.swipeCount}</Text>
                    <Text style={styles.detailStatLabel}>Swipes</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>{userDetail.matchCount}</Text>
                    <Text style={styles.detailStatLabel}>Matches</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>{userDetail.photos.length}</Text>
                    <Text style={styles.detailStatLabel}>Photos</Text>
                  </View>
                  <View style={styles.detailStatItem}>
                    <Text style={styles.detailStatValue}>{userDetail.reports.length}</Text>
                    <Text style={styles.detailStatLabel}>Reports</Text>
                  </View>
                </View>
              </View>

              {/* Profile details */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Profile</Text>
                <View style={styles.detailFieldsGrid}>
                  <DetailField label="Life Stage" value={userDetail.profile.life_stage} />
                  <DetailField label="Friendship Style" value={userDetail.profile.friendship_style} />
                  <DetailField label="Race" value={userDetail.profile.race} />
                  <DetailField label="Religion" value={userDetail.profile.religion} />
                  <DetailField label="Pronouns" value={userDetail.profile.pronouns} />
                  <DetailField label="New to City" value={userDetail.profile.is_new_to_city ? "Yes" : "No"} />
                  <DetailField label="Joined" value={formatDate(userDetail.profile.created_at)} />
                </View>
              </View>

              {/* Photos */}
              {userDetail.photos.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Photos ({userDetail.photos.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {userDetail.photos.map((photo: any) => (
                      <Image
                        key={photo.id}
                        source={{ uri: photo.url }}
                        style={styles.detailPhotoThumb}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Reports against this user */}
              {userDetail.reports.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Reports Against ({userDetail.reports.length})</Text>
                  {userDetail.reports.map((r: any) => (
                    <View key={r.id} style={styles.detailReportItem}>
                      <View style={styles.detailReportRow}>
                        <Text style={styles.reportReason}>{r.reason}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            r.status === "pending" && { backgroundColor: "#FFEAA7" },
                            r.status === "actioned" && { backgroundColor: "#55EFC4" },
                            r.status === "dismissed" && { backgroundColor: "#DFE6E9" },
                            r.status === "reviewed" && { backgroundColor: "#74B9FF" },
                          ]}
                        >
                          <Text style={styles.statusText}>{r.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.errorTime}>{formatDate(r.created_at)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={[styles.detailSection, { gap: 8 }]}>
                <Text style={styles.detailSectionTitle}>Actions</Text>
                {userDetail.profile.is_suspended ? (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: "#00B894" }]}
                    onPress={() =>
                      handleUnsuspend(userDetail.profile.id, userDetail.profile.name)
                    }
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    <Text style={styles.detailActionText}>Unsuspend User</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: "#D63031" }]}
                    onPress={() =>
                      setSuspendModal({
                        userId: userDetail.profile.id,
                        name: userDetail.profile.name,
                      })
                    }
                  >
                    <Ionicons name="ban" size={18} color="#FFF" />
                    <Text style={styles.detailActionText}>Suspend User</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.loadingCenter}>
              <Text style={styles.emptyText}>User not found</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ─── Suspend Modal ──────────────────────────────────── */}
      <Modal
        visible={suspendModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspendModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSuspendModal(null)}>
          <Pressable style={styles.suspendModalContent} onPress={() => {}}>
            <Text style={styles.suspendModalTitle}>
              Suspend {suspendModal?.name}
            </Text>
            <Text style={styles.suspendModalLabel}>Reason</Text>
            <TextInput
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="e.g. Inappropriate behavior"
              placeholderTextColor={COLORS.textMuted}
              style={styles.suspendInput}
              multiline
            />
            <Text style={styles.suspendModalLabel}>Duration (days)</Text>
            <View style={styles.durationRow}>
              {["1", "3", "7", "14", "30"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationChip,
                    suspendDays === d && styles.durationChipActive,
                  ]}
                  onPress={() => setSuspendDays(d)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      suspendDays === d && styles.durationChipTextActive,
                    ]}
                  >
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.suspendActions}>
              <TouchableOpacity
                style={[styles.suspendActionBtn, { backgroundColor: COLORS.surface }]}
                onPress={() => setSuspendModal(null)}
              >
                <Text style={[styles.suspendActionText, { color: COLORS.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.suspendActionBtn, { backgroundColor: "#D63031" }]}
                onPress={handleSuspend}
              >
                <Text style={styles.suspendActionText}>Suspend</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helper Components ──────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.statCard, { borderLeftColor: color }]}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Wrapper>
  );
}

function DetailField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailField}>
      <Text style={styles.detailFieldLabel}>{label}</Text>
      <Text style={styles.detailFieldValue}>{value}</Text>
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
    flexGrow: 0,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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

  // Search
  userCountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  userCountText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // User cards
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
  },
  userCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  userMeta: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userJoined: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: "#6C5CE7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  adminBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  suspendedBadge: {
    backgroundColor: "#FFEAA7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  suspendedBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: "#D63031",
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
  errorStackContainer: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  errorStackLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    lineHeight: 14,
  },
  errorExtra: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    padding: 8,
  },
  tapToExpand: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: COLORS.primary,
    marginTop: 2,
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
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
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
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── User Detail Modal ─────────────────────────────────
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
    marginBottom: 16,
  },
  detailPhoto: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  detailPhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailName: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  detailMeta: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailProfession: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: COLORS.primary,
    marginTop: 2,
  },
  suspensionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFEAA7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  suspensionText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#D63031",
  },
  suspensionReason: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.text,
    marginTop: 2,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  detailEmoji: {
    fontSize: 28,
  },
  detailSection: {
    marginTop: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  detailStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  detailStatItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  detailStatValue: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  detailStatLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailFieldsGrid: {
    marginTop: 8,
    gap: 6,
  },
  detailField: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  detailFieldLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
  detailFieldValue: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  detailPhotoThumb: {
    width: 80,
    height: 100,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: COLORS.surface,
  },
  detailReportItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 4,
  },
  detailReportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  detailActionText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  // ─── Suspend Modal ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  suspendModalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  suspendModalTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    textAlign: "center",
  },
  suspendModalLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  suspendInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    minHeight: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationRow: {
    flexDirection: "row",
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  durationChipTextActive: {
    color: COLORS.primary,
  },
  suspendActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  suspendActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  suspendActionText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  // ─── Premium Gate ─────────────────────────────────────────
  gateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gateButtonActive: {
    backgroundColor: "#00B894",
    borderColor: "#00B894",
  },
  gateButtonActiveRed: {
    backgroundColor: "#D63031",
    borderColor: "#D63031",
  },
  gateButtonActiveOrange: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  gateButtonText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  cityName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  cityCount: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cityToggle: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#E8F8F0",
  },
  cityToggleActive: {
    backgroundColor: "#D63031",
  },
  cityToggleText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: "#00B894",
  },
});
