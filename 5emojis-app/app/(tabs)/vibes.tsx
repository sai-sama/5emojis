import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { logError } from "../../lib/error-logger";
import {
  fetchMatchesEnhanced,
  fetchIncomingVibes,
  recordSwipe,
  formatMessageTime,
  type EnhancedMatch,
  type MatchFilter,
  type IncomingVibe,
} from "../../lib/swipe-service";
import { supabase } from "../../lib/supabase";
import { blockUser } from "../../lib/block-report-service";
import ReportModal from "../../components/ReportModal";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { fonts } from "../../lib/fonts";
import { COLORS, PREMIUM_GATES } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import LottieLoading from "../../components/lottie/LottieLoading";
import LottieEmptyState from "../../components/lottie/LottieEmptyState";
import TabHeader from "../../components/navigation/TabHeader";

// ─── Filter config ──────────────────────────────────────────
const FILTERS: { key: MatchFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New \u{1F9CA}" },
  { key: "chatting", label: "Chatting \u{1F4AC}" },
  { key: "perfect", label: "Perfect \u{2728}" },
];

// ─── Filter Chips ───────────────────────────────────────────
function FilterChips({
  active,
  onChange,
  counts,
}: {
  active: MatchFilter;
  onChange: (f: MatchFilter) => void;
  counts: Record<MatchFilter, number>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => {
              onChange(f.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
            {counts[f.key] > 0 && f.key !== "all" && (
              <View
                style={[
                  styles.filterBadge,
                  isActive && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    isActive && styles.filterBadgeTextActive,
                  ]}
                >
                  {counts[f.key]}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Vibe Card (horizontal "Who Vibed You" row) ─────────────
function VibeCard({
  vibe,
  onVibeBack,
  onPass,
}: {
  vibe: IncomingVibe;
  onVibeBack: () => void;
  onPass: () => void;
}) {
  const age = calculateAge(vibe.user.dob);
  const sortedEmojis = [...vibe.emojis].sort((a, b) => a.position - b.position);
  const isPremiumLocked = PREMIUM_GATES.seeWhoVibedYou;

  return (
    <View style={styles.vibeCard}>
      <View style={styles.vibePhotoWrap}>
        {vibe.photo ? (
          <Image
            source={{ uri: vibe.photo.url }}
            style={[styles.vibePhoto, isPremiumLocked && styles.vibePhotoBlur]}
            blurRadius={isPremiumLocked ? 25 : 0}
          />
        ) : (
          <View style={[styles.vibePhoto, styles.vibePhotoPlaceholder]}>
            <Ionicons name="person" size={28} color={COLORS.textMuted} />
          </View>
        )}
        {isPremiumLocked && (
          <View style={styles.lockOverlay}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
          </View>
        )}
      </View>

      <Text style={styles.vibeName} numberOfLines={1}>
        {isPremiumLocked ? "???" : `${vibe.user.name}, ${age}`}
      </Text>

      <View style={styles.vibeEmojis}>
        {sortedEmojis.map((e) => (
          <Text key={e.id} style={styles.vibeEmojiChar}>
            {e.emoji}
          </Text>
        ))}
      </View>

      {isPremiumLocked ? (
        <Pressable
          style={styles.vibeUnlockBtn}
          onPress={() =>
            Alert.alert(
              "Unlock Vibes",
              "Upgrade to see who vibed you!",
              [{ text: "OK" }]
            )
          }
        >
          <Text style={styles.vibeUnlockText}>Unlock</Text>
        </Pressable>
      ) : (
        <View style={styles.vibeActions}>
          <Pressable style={styles.vibePassBtn} onPress={onPass}>
            <Ionicons name="close" size={20} color={COLORS.pass} />
          </Pressable>
          <Pressable style={styles.vibeBackBtn} onPress={onVibeBack}>
            <Text style={styles.vibeBackText}>💜</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Enhanced Match Card ────────────────────────────────────
function MatchCard({
  item,
  onLongPress,
}: {
  item: EnhancedMatch;
  onLongPress: (item: EnhancedMatch) => void;
}) {
  const {
    otherUser,
    otherEmojis,
    otherPhoto,
    match,
    chatState,
    lastMessage,
    unreadCount,
    friendshipDuration,
  } = item;
  const age = calculateAge(otherUser.dob);
  const sortedEmojis = [...otherEmojis].sort((a, b) => a.position - b.position);

  // Format last message preview
  const previewText = (() => {
    if (chatState !== "chat_active" || !lastMessage) return null;
    if (lastMessage.is_emoji_only) return lastMessage.content;
    return lastMessage.content.length > 40
      ? lastMessage.content.slice(0, 40) + "..."
      : lastMessage.content;
  })();

  const timeLabel = lastMessage ? formatMessageTime(lastMessage.created_at) : "";

  return (
    <Pressable
      style={[styles.card, unreadCount > 0 && styles.cardUnread]}
      onPress={() => router.push(`/chat/${match.id}`)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(item);
      }}
      delayLongPress={500}
    >
      {/* Photo */}
      <View style={styles.photoWrapper}>
        {otherPhoto ? (
          <Image source={{ uri: otherPhoto.url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Ionicons name="person" size={30} color={COLORS.textMuted} />
          </View>
        )}
        {unreadCount > 0 && (
          <View style={styles.unreadDot}>
            <Text style={styles.unreadDotText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {/* Row 1: Name + duration */}
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {otherUser.name}, {age}
          </Text>
          <Text style={styles.durationText}>{friendshipDuration}</Text>
        </View>

        {/* Row 2: Profession */}
        {otherUser.profession && (
          <Text style={styles.cardProfession} numberOfLines={1}>
            {otherUser.profession}
          </Text>
        )}

        {/* Row 3: Emoji bubbles + match badge */}
        <View style={styles.emojiRow}>
          <View style={styles.emojiStrip}>
            {sortedEmojis.map((e) => (
              <View key={e.id} style={styles.emojiBubble}>
                <Text style={styles.emojiChar}>{e.emoji}</Text>
              </View>
            ))}
          </View>
          {match.emoji_match_count > 0 && (
            <View
              style={[
                styles.emojiCountBadge,
                match.is_emoji_perfect && styles.emojiCountBadgePerfect,
              ]}
            >
              <Text
                style={[
                  styles.emojiCountText,
                  match.is_emoji_perfect && styles.emojiCountTextPerfect,
                ]}
              >
                {match.emoji_match_count}/5
                {match.is_emoji_perfect ? " ✨" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Row 4: Chat state indicator */}
        <View style={styles.chatStateRow}>
          {chatState === "icebreaker_pending" && (
            <Text style={styles.chatStatePending}>🧊 Answer icebreaker</Text>
          )}
          {chatState === "icebreaker_waiting" && (
            <Text style={styles.chatStateWaiting}>⏳ Waiting for reply</Text>
          )}
          {chatState === "chat_active" && previewText && (
            <View style={styles.previewRow}>
              <Text
                style={[
                  styles.previewText,
                  unreadCount > 0 && styles.previewTextBold,
                ]}
                numberOfLines={1}
              >
                {previewText}
              </Text>
              <Text style={styles.previewTime}>{timeLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function VibesScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<EnhancedMatch[]>([]);
  const [vibes, setVibes] = useState<IncomingVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOnVibe, setActingOnVibe] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MatchFilter>("all");

  // Block & Report state
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    try {
      const [matchData, vibeData] = await Promise.all([
        fetchMatchesEnhanced(session.user.id),
        fetchIncomingVibes(session.user.id),
      ]);
      setMatches(matchData);
      setVibes(vibeData);
    } catch (err: any) {
      console.warn("Failed to load matches/vibes:", err);
      logError(err, { screen: "VibesScreen", context: "load_matches_and_vibes" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Realtime: refresh when new matches or messages arrive
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("vibes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "swipes" },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ─── Filtering ────────────────────────────────────────────
  const filteredMatches = useMemo(() => {
    switch (activeFilter) {
      case "new":
        return matches.filter((m) => m.chatState === "icebreaker_pending");
      case "chatting":
        return matches.filter((m) => m.chatState === "chat_active");
      case "perfect":
        return matches.filter((m) => m.match.is_emoji_perfect);
      default:
        return matches;
    }
  }, [matches, activeFilter]);

  const filterCounts = useMemo<Record<MatchFilter, number>>(
    () => ({
      all: matches.length,
      new: matches.filter((m) => m.chatState === "icebreaker_pending").length,
      chatting: matches.filter((m) => m.chatState === "chat_active").length,
      perfect: matches.filter((m) => m.match.is_emoji_perfect).length,
    }),
    [matches]
  );

  // ─── Vibe actions ─────────────────────────────────────────
  const handleVibeBack = useCallback(
    async (vibe: IncomingVibe) => {
      if (!session?.user || actingOnVibe) return;
      setActingOnVibe(vibe.swipeId);
      try {
        const result = await recordSwipe(
          session.user.id,
          vibe.user.id,
          "right"
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setVibes((prev) => prev.filter((v) => v.swipeId !== vibe.swipeId));

        if (result.matched) {
          setMatches((prev) => [
            {
              match: result.match,
              otherUser: result.otherUser,
              otherEmojis: result.otherEmojis,
              otherPhoto: result.otherPhoto,
              icebreakerQuestion: result.icebreakerQuestion,
              otherReveals: result.otherReveals,
              chatState: "icebreaker_pending",
              lastMessage: null,
              lastMessageAt: result.match.created_at,
              unreadCount: 0,
              friendshipDuration: "today",
            },
            ...prev,
          ]);
          Alert.alert(
            "It's a match! 🎉",
            `You and ${vibe.user.name} vibed each other!`,
            [
              { text: "Keep browsing" },
              {
                text: "Send emojis",
                onPress: () => router.push(`/chat/${result.match.id}`),
              },
            ]
          );
        }
      } catch (err: any) {
        console.warn("Vibe back failed:", err);
        logError(err, { screen: "VibesScreen", context: "vibe_back" });
      } finally {
        setActingOnVibe(null);
      }
    },
    [session, actingOnVibe]
  );

  const handlePass = useCallback(
    async (vibe: IncomingVibe) => {
      if (!session?.user || actingOnVibe) return;
      setActingOnVibe(vibe.swipeId);
      try {
        await recordSwipe(session.user.id, vibe.user.id, "left");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setVibes((prev) => prev.filter((v) => v.swipeId !== vibe.swipeId));
      } catch (err: any) {
        console.warn("Pass failed:", err);
        logError(err, { screen: "VibesScreen", context: "pass_vibe" });
      } finally {
        setActingOnVibe(null);
      }
    },
    [session, actingOnVibe]
  );

  // ─── Long press on match card ─────────────────────────────
  const handleMatchLongPress = useCallback(
    (item: EnhancedMatch) => {
      if (!session?.user) return;
      const otherUserId =
        item.match.user1_id === session.user.id
          ? item.match.user2_id
          : item.match.user1_id;
      const otherName = item.otherUser.name;

      Alert.alert(otherName, "What would you like to do?", [
        {
          text: "Report",
          onPress: () => setReportTarget({ id: otherUserId, name: otherName }),
        },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              `Block ${otherName}?`,
              "They won't be able to see your profile or contact you. Your match and messages will be removed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: async () => {
                    await blockUser(session.user.id, otherUserId);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Warning
                    );
                    setMatches((prev) =>
                      prev.filter((m) => m.match.id !== item.match.id)
                    );
                  },
                },
              ]
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [session]
  );

  // ─── List header: Vibes section + filter chips ────────────
  const renderListHeader = () => (
    <View>
      {/* Who Vibed You */}
      {vibes.length > 0 && (
        <View style={styles.vibesSection}>
          <View style={styles.vibesHeader}>
            <Text style={styles.vibesSectionTitle}>Who Vibed You</Text>
            <View style={styles.vibeCountBadge}>
              <Text style={styles.vibeCountText}>{vibes.length}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vibesScroll}
          >
            {vibes.map((vibe) => (
              <VibeCard
                key={vibe.swipeId}
                vibe={vibe}
                onVibeBack={() => handleVibeBack(vibe)}
                onPass={() => handlePass(vibe)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter chips */}
      {matches.length > 0 && (
        <View style={styles.filterSection}>
          <FilterChips
            active={activeFilter}
            onChange={setActiveFilter}
            counts={filterCounts}
          />
        </View>
      )}
    </View>
  );

  const hasContent = matches.length > 0 || vibes.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="warm" />
      <View style={styles.container}>
        <TabHeader />

        {loading ? (
          <View style={styles.centered}>
            <LottieLoading message="Loading your friends..." />
          </View>
        ) : !hasContent ? (
          <LottieEmptyState
            title="No matches yet"
            subtitle="Start swiping to find friends who share your emoji energy!"
          >
            <Pressable
              style={styles.emptyCtaButton}
              onPress={() => router.push("/(tabs)/")}
            >
              <Ionicons name="swap-horizontal" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCtaText}>Start Swiping</Text>
            </Pressable>
          </LottieEmptyState>
        ) : (
          <FlatList
            data={filteredMatches}
            keyExtractor={(item) => item.match.id}
            renderItem={({ item }) => (
              <MatchCard item={item} onLongPress={handleMatchLongPress} />
            )}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterEmoji}>
                  {activeFilter === "new" ? "🧊" : activeFilter === "chatting" ? "💬" : activeFilter === "perfect" ? "✨" : "🤝"}
                </Text>
                <Text style={styles.emptyFilterTitle}>
                  {activeFilter === "all"
                    ? "No matches yet"
                    : `No ${activeFilter === "new" ? "new" : activeFilter === "chatting" ? "active" : "perfect"} matches`}
                </Text>
                <Text style={styles.emptyFilterText}>
                  {activeFilter === "all"
                    ? "Vibe back on someone to start matching!"
                    : activeFilter === "new"
                    ? "Answer your icebreakers to move friends to chatting"
                    : activeFilter === "perfect"
                    ? "A perfect match means all 5 emojis overlap — keep swiping!"
                    : "Start a conversation after the icebreaker"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reporterId={session?.user?.id ?? ""}
          reportedId={reportTarget.id}
          reportedName={reportTarget.name}
          onComplete={() => {
            setReportTarget(null);
            Alert.alert(
              "Report Submitted",
              "Thank you for helping keep 5Emojis safe."
            );
            loadData();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ─── Vibes section ──────────────────────────────
  vibesSection: {
    marginBottom: 16,
  },
  vibesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  vibesSectionTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  vibeCountBadge: {
    backgroundColor: COLORS.accent,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  vibeCountText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  vibesScroll: {
    gap: 12,
  },
  vibeCard: {
    width: 145,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.1)",
  },
  vibePhotoWrap: {
    position: "relative",
    marginBottom: 8,
  },
  vibePhoto: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#F0EDE8",
  },
  vibePhotoBlur: {
    opacity: 0.6,
  },
  vibePhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  vibeName: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  vibeEmojis: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 8,
  },
  vibeEmojiChar: {
    fontSize: 14,
  },
  vibeActions: {
    flexDirection: "row",
    gap: 12,
  },
  vibePassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.passSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFD6D6",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vibePassText: {
    fontSize: 16,
    color: COLORS.passButton,
    fontWeight: "700",
  },
  vibeBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F0EBFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D4C4FF",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  vibeBackText: {
    fontSize: 16,
  },
  vibeUnlockBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  vibeUnlockText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  // ─── Filter chips ─────────────────────────────────
  filterSection: {
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primaryBorder,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
  },
  filterBadgeTextActive: {
    color: "#FFF",
  },

  // ─── Enhanced match cards ─────────────────────────
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.06)",
  },
  cardUnread: {
    borderColor: "rgba(124, 58, 237, 0.2)",
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F0EDE8",
    borderWidth: 2,
    borderColor: "#F0EBFF",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  unreadDotText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardName: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    flexShrink: 1,
  },
  durationText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  cardProfession: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  emojiStrip: {
    flexDirection: "row",
    gap: 3,
  },
  emojiBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiChar: {
    fontSize: 15,
  },
  emojiCountBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  emojiCountBadgePerfect: {
    backgroundColor: COLORS.highlightSurface,
    borderColor: COLORS.highlight,
  },
  emojiCountText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  emojiCountTextPerfect: {
    color: COLORS.highlightDark,
  },

  // ─── Chat state indicators ─────────────────────────
  chatStateRow: {
    marginTop: 6,
  },
  chatStatePending: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  chatStateWaiting: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    flex: 1,
  },
  previewTextBold: {
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  previewTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginLeft: 8,
  },

  // ─── Empty states ──────────────────────────────────
  emptyFilter: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyFilterEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyFilterTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyFilterText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyCtaText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
