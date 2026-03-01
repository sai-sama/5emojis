import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
// SafeAreaView handled by TabHeader
import { useFocusEffect, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import {
  fetchMatches,
  fetchIncomingVibes,
  recordSwipe,
  type MatchWithProfile,
  type IncomingVibe,
} from "../../lib/swipe-service";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { fonts } from "../../lib/fonts";
import { COLORS, PREMIUM_GATES } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import LottieLoading from "../../components/lottie/LottieLoading";
import LottieEmptyState from "../../components/lottie/LottieEmptyState";
import TabHeader from "../../components/navigation/TabHeader";

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
      {/* Photo */}
      <View style={styles.vibePhotoWrap}>
        {vibe.photo ? (
          <Image
            source={{ uri: vibe.photo.url }}
            style={[styles.vibePhoto, isPremiumLocked && styles.vibePhotoBlur]}
            blurRadius={isPremiumLocked ? 25 : 0}
          />
        ) : (
          <View style={[styles.vibePhoto, styles.vibePhotoPlaceholder]}>
            <Text style={{ fontSize: 28 }}>👤</Text>
          </View>
        )}
        {isPremiumLocked && (
          <View style={styles.lockOverlay}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <Text style={styles.vibeName} numberOfLines={1}>
        {isPremiumLocked ? "???" : `${vibe.user.name}, ${age}`}
      </Text>

      {/* Emojis */}
      <View style={styles.vibeEmojis}>
        {sortedEmojis.map((e) => (
          <Text key={e.id} style={styles.vibeEmojiChar}>
            {e.emoji}
          </Text>
        ))}
      </View>

      {/* Actions */}
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
            <Text style={styles.vibePassText}>✕</Text>
          </Pressable>
          <Pressable style={styles.vibeBackBtn} onPress={onVibeBack}>
            <Text style={styles.vibeBackText}>💜</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Match Card (vertical list) ──────────────────────────────
function MatchCard({ item }: { item: MatchWithProfile }) {
  const { otherUser, otherEmojis, otherPhoto, match } = item;
  const age = calculateAge(otherUser.dob);
  const sortedEmojis = [...otherEmojis].sort((a, b) => a.position - b.position);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/chat/${match.id}`)}
    >
      {/* Photo */}
      <View style={styles.photoWrapper}>
        {otherPhoto ? (
          <Image source={{ uri: otherPhoto.url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
        )}
        {match.is_emoji_perfect && (
          <View style={styles.perfectDot}>
            <Text style={{ fontSize: 10 }}>✨</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {otherUser.name}, {age}
          </Text>
          {match.emoji_match_count > 0 && (
            <View style={styles.emojiCountBadge}>
              <Text style={styles.emojiCountText}>
                {match.emoji_match_count}/5
              </Text>
            </View>
          )}
        </View>

        {otherUser.profession && (
          <Text style={styles.cardProfession} numberOfLines={1}>
            {otherUser.profession}
          </Text>
        )}

        {/* Emoji strip */}
        <View style={styles.emojiStrip}>
          {sortedEmojis.map((e) => (
            <Text key={e.id} style={styles.emojiChar}>
              {e.emoji}
            </Text>
          ))}
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function VibesScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [vibes, setVibes] = useState<IncomingVibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOnVibe, setActingOnVibe] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    try {
      const [matchData, vibeData] = await Promise.all([
        fetchMatches(session.user.id),
        fetchIncomingVibes(session.user.id),
      ]);
      setMatches(matchData);
      setVibes(vibeData);
    } catch (err) {
      console.warn("Failed to load matches/vibes:", err);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

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

        // Remove from vibes list
        setVibes((prev) => prev.filter((v) => v.swipeId !== vibe.swipeId));

        if (result.matched) {
          // Add to matches list at the top
          setMatches((prev) => [
            {
              match: result.match,
              otherUser: result.otherUser,
              otherEmojis: result.otherEmojis,
              otherPhoto: result.otherPhoto,
              icebreakerQuestion: result.icebreakerQuestion,
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
                onPress: () =>
                  router.push(`/chat/${result.match.id}`),
              },
            ]
          );
        }
      } catch (err) {
        console.warn("Vibe back failed:", err);
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
      } catch (err) {
        console.warn("Pass failed:", err);
      } finally {
        setActingOnVibe(null);
      }
    },
    [session, actingOnVibe]
  );

  // ─── Vibes header section (shown above matches) ───────────
  const renderVibesSection = () => {
    if (vibes.length === 0) return null;

    return (
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
    );
  };

  const hasContent = matches.length > 0 || vibes.length > 0;

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="warm" />
      <View style={styles.container}>
        <TabHeader />

      {loading ? (
        <View style={styles.centered}>
          <LottieLoading message="Finding your vibes..." />
        </View>
      ) : !hasContent ? (
        <LottieEmptyState
          title="No matches yet"
          subtitle="Start swiping to find friends who share your emoji vibe!"
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match.id}
          renderItem={({ item }) => <MatchCard item={item} />}
          ListHeaderComponent={renderVibesSection}
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
            vibes.length > 0 ? (
              <View style={styles.noMatchesYet}>
                <Text style={styles.noMatchesText}>
                  Vibe back to start matching!
                </Text>
              </View>
            ) : null
          }
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ─── Vibes section ──────────────────────────────
  vibesSection: {
    marginBottom: 20,
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

  // ─── Match cards ────────────────────────────────
  card: {
    flexDirection: "row",
    alignItems: "center",
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
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#F0EDE8",
    borderWidth: 2,
    borderColor: "#F0EBFF",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  perfectDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.highlight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardName: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    flexShrink: 1,
  },
  emojiCountBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  emojiCountText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  cardProfession: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emojiStrip: {
    flexDirection: "row",
    gap: 3,
    marginTop: 6,
  },
  emojiChar: {
    fontSize: 16,
    backgroundColor: COLORS.primarySurface,
    borderRadius: 6,
    overflow: "hidden",
    width: 28,
    height: 28,
    textAlign: "center",
    lineHeight: 28,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.primary,
    marginLeft: 8,
    opacity: 0.4,
  },
  noMatchesYet: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noMatchesText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
});
