import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  Platform,
  Modal,
  AppState,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { usePremium } from "../../lib/premium-context";
import { useUnread } from "../../lib/unread-context";
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
import { calculateAge, formatDistance } from "../../components/swipe/mockProfiles";
import { getZodiacSign } from "../../lib/zodiac";
import { fonts } from "../../lib/fonts";
import { COLORS, GENDERS } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import LottieLoading from "../../components/lottie/LottieLoading";
import LottieEmptyState from "../../components/lottie/LottieEmptyState";
import TabHeader from "../../components/navigation/TabHeader";

// ─── Filter config ──────────────────────────────────────────
const FILTERS: { key: MatchFilter; label: string; emoji: string }[] = [
  { key: "all", label: "All Friends", emoji: "" },
  { key: "unread", label: "Unread", emoji: "\u{1F534}" },
  { key: "new", label: "New", emoji: "\u{1F9CA}" },
  { key: "waiting", label: "Waiting", emoji: "\u{23F3}" },
  { key: "chatting", label: "Chatting", emoji: "\u{1F4AC}" },
  { key: "perfect", label: "Perfect Match", emoji: "\u{2728}" },
];

// ─── Filter Dropdown ────────────────────────────────────────
function FilterDropdown({
  active,
  onChange,
  counts,
}: {
  active: MatchFilter;
  onChange: (f: MatchFilter) => void;
  counts: Record<MatchFilter, number>;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const activeFilter = FILTERS.find((f) => f.key === active) ?? FILTERS[0];

  const handleOpen = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, _w, h) => {
      setMenuPos({ top: y + h + 6, left: x });
      setOpen(true);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          style={styles.dropdownTrigger}
          onPress={handleOpen}
        >
          <Text style={styles.dropdownTriggerText}>
            {activeFilter.emoji ? `${activeFilter.emoji} ` : ""}{activeFilter.label}
          </Text>
          {counts[active] > 0 && (
            <View style={styles.dropdownBadge}>
              <Text style={styles.dropdownBadgeText}>{counts[active]}</Text>
            </View>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.primary}
            style={{ marginLeft: 4 }}
          />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="none" statusBarTranslucent>
        <Pressable style={styles.dropdownBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[styles.dropdownMenu, { position: "absolute", top: menuPos.top, left: menuPos.left }]}
            onStartShouldSetResponder={() => true}
          >
            {FILTERS.map((f) => {
              const isActive = active === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    onChange(f.key);
                    setOpen(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                >
                  <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
                    {f.emoji ? `${f.emoji} ` : ""}{f.label}
                  </Text>
                  {counts[f.key] > 0 && (
                    <View style={[styles.dropdownItemBadge, isActive && styles.dropdownItemBadgeActive]}>
                      <Text style={[styles.dropdownItemBadgeText, isActive && styles.dropdownItemBadgeTextActive]}>
                        {counts[f.key]}
                      </Text>
                    </View>
                  )}
                  {isActive && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Vibe Card (horizontal "Who Liked You" row) ─────────────
function VibeCard({
  vibe,
  onVibeBack,
  onPass,
  isPremiumLocked,
  userEmojis,
}: {
  vibe: IncomingVibe;
  onVibeBack: () => void;
  onPass: () => void;
  isPremiumLocked: boolean;
  userEmojis: Set<string>;
}) {
  const age = calculateAge(vibe.user.dob);
  const sortedEmojis = [...vibe.emojis].sort((a, b) => a.position - b.position);
  const genderInfo = GENDERS.find((g) => g.value === vibe.user.gender) || GENDERS[0];
  const matchingCount = sortedEmojis.filter((e) => userEmojis.has(e.emoji)).length;
  const isPerfect = matchingCount === 5;

  const handleCardPress = () => {
    if (isPremiumLocked) {
      router.push("/premium");
    } else {
      router.push(`/user/${vibe.user.id}`);
    }
  };

  return (
    <View style={styles.vibeCardOuter}>
      {/* Super like star — on border, outside overflow:hidden card */}
      {vibe.isSuperLike && (
        <View style={styles.vibeSuperLikeBadge}>
          <Text style={styles.vibeSuperLikeStar}>⭐</Text>
        </View>
      )}
      <Pressable
        style={[styles.vibeCard, vibe.isSuperLike && styles.vibeCardSuperLike]}
        onPress={handleCardPress}
      >
        {/* Photo — fills top of card */}
        <View style={styles.vibePhotoWrap}>
          {vibe.photo ? (
            <Image
              source={{ uri: vibe.photo.url }}
              style={[styles.vibePhoto, isPremiumLocked && styles.vibePhotoBlur]}
              blurRadius={isPremiumLocked ? 25 : 0}
            />
          ) : (
            <View style={[styles.vibePhoto, styles.vibePhotoPlaceholder]}>
              <Ionicons name="person" size={32} color={COLORS.textMuted} />
            </View>
          )}
          {isPremiumLocked && (
            <View style={styles.lockOverlay}>
              <Text style={{ fontSize: 22 }}>🔒</Text>
            </View>
          )}
        </View>

      {/* Info section */}
      <View style={styles.vibeInfoSection}>
        <Text style={styles.vibeName} numberOfLines={1}>
          {isPremiumLocked ? "???" : `${vibe.user.name}, ${age}`}
        </Text>
        {!isPremiumLocked && (
          <View style={[styles.genderDot, { backgroundColor: genderInfo.color }]}>
            <Text style={styles.genderDotEmoji}>{genderInfo.emoji}</Text>
          </View>
        )}
      </View>

      {/* Emojis — matching emojis get golden border, perfect match gets sparkle strip */}
      {isPerfect && !isPremiumLocked ? (
        <View style={styles.vibeEmojis}>
          <View style={styles.vibePerfectStrip}>
            <Text style={styles.perfectSparkle}>✨</Text>
            {sortedEmojis.map((e) => (
              <Text key={e.id} style={styles.vibeEmojiChar}>{e.emoji}</Text>
            ))}
            <Text style={styles.perfectSparkle}>✨</Text>
          </View>
        </View>
      ) : (
        <View style={styles.vibeEmojis}>
          {sortedEmojis.map((e) => {
            const isMatch = userEmojis.has(e.emoji) && !isPremiumLocked;
            return (
              <View
                key={e.id}
                style={[styles.vibeEmojiBubble, isMatch && styles.vibeEmojiBubbleMatch]}
              >
                <Text style={styles.vibeEmojiChar}>{e.emoji}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action buttons */}
      {isPremiumLocked ? (
        <Pressable
          style={styles.vibeUnlockBtn}
          onPress={() => router.push("/premium")}
        >
          <Text style={styles.vibeUnlockText}>Unlock</Text>
        </Pressable>
      ) : (
        <View style={styles.vibeActions}>
          <Pressable style={styles.vibePassBtn} onPress={(e) => { e.stopPropagation(); onPass(); }}>
            <Ionicons name="close" size={20} color={COLORS.pass} />
          </Pressable>
          <Pressable style={styles.vibeBackBtn} onPress={(e) => { e.stopPropagation(); onVibeBack(); }}>
            <Text style={styles.vibeBackText}>💜</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
    </View>
  );
}

// ─── Enhanced Match Card ────────────────────────────────────
function MatchCard({
  item,
  onLongPress,
  userEmojis,
  userLat,
  userLng,
}: {
  item: EnhancedMatch;
  onLongPress: (item: EnhancedMatch) => void;
  userEmojis: Set<string>;
  userLat: number;
  userLng: number;
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
    hasSuperLike,
  } = item;
  const age = calculateAge(otherUser.dob);
  const sortedEmojis = [...otherEmojis].sort((a, b) => a.position - b.position);
  const zodiac = getZodiacSign(otherUser.dob);
  const genderInfo = GENDERS.find((g) => g.value === otherUser.gender) || GENDERS[0];
  const hasUserLocation = userLat !== 0 || userLng !== 0;
  const distance = hasUserLocation
    ? formatDistance(userLat, userLng, otherUser.latitude, otherUser.longitude)
    : null;

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
    <View style={styles.cardOuter}>
      {/* Unread badge — top right, outside overflow:hidden card */}
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
        </View>
      )}

      {/* Super like star — top left, outside overflow:hidden card */}
      {hasSuperLike && (
        <View style={styles.superLikeCardBadge}>
          <Text style={styles.superLikeCardStar}>⭐</Text>
        </View>
      )}

      <Pressable
        style={[
          styles.card,
          unreadCount > 0 && styles.cardUnread,
          hasSuperLike && styles.cardSuperLike,
        ]}
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
            <Ionicons name="person" size={32} color={COLORS.textMuted} />
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

        {/* Row 2b: Zodiac · Gender · Distance */}
        <View style={styles.detailChips}>
          <Text style={styles.detailChipText}>{zodiac.emoji}</Text>
          <Text style={styles.detailChipDot}>·</Text>
          <View style={[styles.genderDot, { backgroundColor: genderInfo.color }]}>
            <Text style={styles.genderDotEmoji}>{genderInfo.emoji}</Text>
          </View>
          {distance && (
            <>
              <Text style={styles.detailChipDot}>·</Text>
              <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.detailChipText}>{distance}</Text>
            </>
          )}
        </View>

        {/* Row 3: Emoji bubbles with match highlighting */}
        <View style={styles.emojiRow}>
          {match.is_emoji_perfect ? (
            <View style={styles.perfectEmojiStrip}>
              <Text style={styles.perfectSparkle}>✨</Text>
              {sortedEmojis.map((e) => (
                <View key={e.id} style={styles.emojiBubblePerfect}>
                  <Text style={styles.emojiChar}>{e.emoji}</Text>
                </View>
              ))}
              <Text style={styles.perfectSparkle}>✨</Text>
            </View>
          ) : (
            <View style={styles.emojiStrip}>
              {sortedEmojis.map((e) => {
                const isMatch = userEmojis.has(e.emoji);
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.emojiBubble,
                      isMatch && styles.emojiBubbleMatch,
                    ]}
                  >
                    <Text style={styles.emojiChar}>{e.emoji}</Text>
                  </View>
                );
              })}
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
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function VibesScreen() {
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const { unreadCount, markAllAsRead } = useUnread();
  const [matches, setMatches] = useState<EnhancedMatch[]>([]);
  const [vibes, setVibes] = useState<IncomingVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOnVibe, setActingOnVibe] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MatchFilter>("all");
  const [userEmojis, setUserEmojis] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

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
      const [matchData, vibeData, emojisRes, locationRes] = await Promise.all([
        fetchMatchesEnhanced(session.user.id),
        fetchIncomingVibes(session.user.id),
        supabase
          .from("profile_emojis")
          .select("emoji")
          .eq("user_id", session.user.id),
        supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("id", session.user.id)
          .single(),
      ]);
      setMatches(matchData);
      setVibes(vibeData);
      if (emojisRes.data) {
        setUserEmojis(new Set(emojisRes.data.map((e) => e.emoji)));
      }
      if (locationRes.data?.latitude && locationRes.data?.longitude) {
        setUserLocation({ lat: locationRes.data.latitude, lng: locationRes.data.longitude });
      }
      setLoadError(false);
    } catch (err: any) {
      logError(err, { screen: "VibesScreen", context: "load_matches_and_vibes" });
      setLoadError(true);
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

  // Refresh when app comes back to foreground (e.g. notification tap)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  // Stable ref to loadData so the subscription doesn't churn
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  // Realtime: refresh when new matches or messages arrive
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel("vibes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        () => loadDataRef.current()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadDataRef.current()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "swipes" },
        () => loadDataRef.current()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ─── Filtering ────────────────────────────────────────────
  const filteredMatches = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return matches.filter((m) => m.unreadCount > 0);
      case "new":
        return matches.filter((m) => m.chatState === "icebreaker_pending");
      case "waiting":
        return matches.filter((m) => m.chatState === "icebreaker_waiting");
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
      unread: matches.filter((m) => m.unreadCount > 0).length,
      new: matches.filter((m) => m.chatState === "icebreaker_pending").length,
      waiting: matches.filter((m) => m.chatState === "icebreaker_waiting").length,
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
              hasSuperLike: vibe.isSuperLike,
            },
            ...prev,
          ]);
          Alert.alert(
            "It's a match! 🎉",
            `You and ${vibe.user.name} are now friends! Break the ice.`,
            [
              { text: "Keep browsing" },
              {
                text: "Answer icebreaker",
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
            <Text style={styles.vibesSectionTitle}>Who Liked You</Text>
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
                isPremiumLocked={!isPremium}
                userEmojis={userEmojis}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Friends section header + filter dropdown + mark all read */}
      {matches.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.friendsSectionTitle}>Your Friends</Text>
          <View style={styles.filterRow_wrapper}>
            <FilterDropdown
              active={activeFilter}
              onChange={setActiveFilter}
              counts={filterCounts}
            />
            {unreadCount > 0 && (
              <Pressable
                style={styles.markReadButton}
                onPress={async () => {
                  // Optimistically clear unread badges on all cards immediately
                  setMatches((prev) =>
                    prev.map((m) => (m.unreadCount > 0 ? { ...m, unreadCount: 0 } : m))
                  );
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Persist to DB in background
                  markAllAsRead();
                }}
                hitSlop={8}
              >
                <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
                <Text style={styles.markReadText}>Read all</Text>
              </Pressable>
            )}
          </View>
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
        ) : loadError && !hasContent ? (
          <LottieEmptyState
            title="Couldn't load matches"
            subtitle="Check your internet connection and try again."
          >
            <Pressable
              style={styles.emptyCtaButton}
              onPress={() => {
                setLoading(true);
                loadData();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyCtaText}>Retry</Text>
            </Pressable>
          </LottieEmptyState>
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
              <MatchCard
                item={item}
                onLongPress={handleMatchLongPress}
                userEmojis={userEmojis}
                userLat={userLocation.lat}
                userLng={userLocation.lng}
              />
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
                    ? "Like someone back to start matching!"
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
    paddingLeft: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  vibeCard: {
    width: 160,
    backgroundColor: Platform.OS === "android" ? "#FFFFFF" : "rgba(255,255,255,0.95)",
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.1)",
  },
  vibeCardSuperLike: {
    borderColor: "rgba(255, 215, 0, 0.6)",
    borderWidth: 1.5,
  },
  vibePerfectStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.highlightSurface,
    borderWidth: 1.5,
    borderColor: COLORS.highlight,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vibePhotoWrap: {
    position: "relative",
    width: "100%",
    height: 120,
  },
  vibePhoto: {
    width: "100%",
    height: "100%",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  vibeCardOuter: {
    position: "relative",
  },
  vibeSuperLikeBadge: {
    position: "absolute",
    top: -6,
    left: -4,
    zIndex: 10,
    backgroundColor: "rgba(255, 215, 0, 0.95)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  vibeSuperLikeStar: {
    fontSize: 13,
  },
  vibeInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  vibeName: {
    fontSize: 14,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    textAlign: "center",
    flexShrink: 1,
  },
  genderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  genderDotEmoji: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  vibeEmojis: {
    flexDirection: "row",
    gap: 2,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  vibeEmojiBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vibeEmojiBubbleMatch: {
    backgroundColor: COLORS.highlightSurface,
    borderWidth: 1.5,
    borderColor: COLORS.highlight,
  },
  vibeEmojiChar: {
    fontSize: 14,
  },
  vibeActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    paddingBottom: 10,
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
  },
  vibeBackText: {
    fontSize: 16,
  },
  vibeUnlockBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginBottom: 10,
  },
  vibeUnlockText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  // ─── Filter dropdown ─────────────────────────────────
  filterSection: {
    marginBottom: 14,
  },
  friendsSectionTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 10,
  },
  filterRow_wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  markReadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
  },
  markReadText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  dropdownBackdrop: {
    flex: 1,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: Platform.OS === "android" ? "#FFFFFF" : "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 6,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  dropdownBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dropdownBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  dropdownMenu: {
    minWidth: 200,
    backgroundColor: Platform.OS === "android" ? "#FFFFFF" : "rgba(255,255,255,0.98)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 8,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primarySurface,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    flex: 1,
  },
  dropdownItemTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  dropdownItemBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  dropdownItemBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  dropdownItemBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
  },
  dropdownItemBadgeTextActive: {
    color: "#FFF",
  },

  // ─── Enhanced match cards ─────────────────────────
  cardOuter: {
    position: "relative",
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Platform.OS === "android" ? "#FFF9F9" : "rgba(255,255,255,0.85)",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.06)",
  },
  cardUnread: {
    borderColor: "rgba(124, 58, 237, 0.25)",
    backgroundColor: Platform.OS === "android" ? "#FFFFFF" : "rgba(255,255,255,0.95)",
  },
  cardSuperLike: {
    borderColor: "rgba(255, 215, 0, 0.4)",
    borderWidth: 1.5,
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFF",
    zIndex: 5,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  superLikeCardBadge: {
    position: "absolute",
    top: -6,
    left: -4,
    zIndex: 5,
    backgroundColor: "rgba(255, 215, 0, 0.95)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  superLikeCardStar: {
    fontSize: 12,
  },
  photoWrapper: {
    position: "relative",
    width: 110,
  },
  photo: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F0EDE8",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  detailChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  detailChipText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textMuted,
  },
  detailChipDot: {
    fontSize: 10,
    color: COLORS.textMuted,
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
    borderRadius: 14,
    backgroundColor: COLORS.primarySurface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBubbleMatch: {
    backgroundColor: COLORS.highlightSurface,
    borderWidth: 1.5,
    borderColor: COLORS.highlight,
  },
  emojiBubblePerfect: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  perfectEmojiStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.highlightSurface,
    borderWidth: 1.5,
    borderColor: COLORS.highlight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  perfectSparkle: {
    fontSize: 12,
  },
  emojiChar: {
    fontSize: 15,
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
    fontSize: 15,
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
