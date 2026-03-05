import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import ReportModal from "../../components/ReportModal";
import { useAuth } from "../../lib/auth-context";
import { fetchFullProfile, type FullProfile } from "../../lib/profile-service";
import { blockUser } from "../../lib/block-report-service";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { getZodiacSign } from "../../lib/zodiac";
import { COLORS, GENDERS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { supabase } from "../../lib/supabase";
import { logError } from "../../lib/error-logger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.25; // 4:5 aspect

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useAuth();
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [myEmojis, setMyEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  const currentUserId = session?.user?.id ?? "";
  const isSelf = !!userId && userId === currentUserId;

  const handleBlock = () => {
    const name = profileData?.profile?.name ?? "this user";
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${name}? This will remove your match and you won't see each other again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            if (!userId || !currentUserId) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { error } = await blockUser(currentUserId, userId);
            if (!error) {
              // Go back to vibes list (pop both the profile and chat screens)
              router.dismissAll();
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      (async () => {
        try {
          const data = await fetchFullProfile(userId);
          setProfileData(data);

          // Fetch current user's emojis for match highlighting
          if (session?.user) {
            const { data: emojiRows } = await supabase
              .from("profile_emojis")
              .select("emoji")
              .eq("user_id", session.user.id);
            setMyEmojis((emojiRows ?? []).map((e) => e.emoji));
          }
        } catch (err: any) {
          logError(err, { screen: "UserProfile", context: "load_profile" });
        } finally {
          setLoading(false);
        }
      })();
    }, [userId, session])
  );

  const p = profileData?.profile;
  const photos = profileData?.photos ?? [];
  const sortedEmojis = useMemo(
    () => [...(profileData?.emojis ?? [])].sort((a, b) => a.position - b.position),
    [profileData?.emojis]
  );

  const age = p ? calculateAge(p.dob) : 0;
  const zodiac = p ? getZodiacSign(p.dob) : null;
  const genderInfo = p ? GENDERS.find((g) => g.value === p.gender) : null;
  const location = p
    ? p.state
      ? `${p.city}, ${p.state}`
      : p.city
    : "";

  // Emoji match count
  const myEmojiSet = useMemo(() => new Set(myEmojis), [myEmojis]);
  const matchCount = useMemo(
    () => sortedEmojis.filter((e) => myEmojiSet.has(e.emoji)).length,
    [sortedEmojis, myEmojiSet]
  );

  // "More" section items — only show if populated
  const moreItems = useMemo(() => {
    if (!profileData) return [];
    const items: { icon: string; label: string; value: string }[] = [];
    if (profileData.languages.length > 0)
      items.push({ icon: "chatbubble-ellipses-outline", label: "Languages", value: profileData.languages.join(", ") });
    if (profileData.pets.length > 0)
      items.push({ icon: "paw-outline", label: "Pets", value: profileData.pets.join(", ") });
    if (profileData.dietary.length > 0)
      items.push({ icon: "leaf-outline", label: "Dietary", value: profileData.dietary.join(", ") });
    if (profileData.availability.length > 0)
      items.push({ icon: "time-outline", label: "Available", value: profileData.availability.join(", ") });
    return items;
  }, [profileData]);

  // About section items — only show if populated
  const aboutItems = useMemo(() => {
    if (!p) return [];
    const items: { label: string; value: string }[] = [];
    if (p.life_stage) items.push({ label: "Life stage", value: p.life_stage });
    if (p.friendship_style) items.push({ label: "Friendship style", value: p.friendship_style });
    if (p.personality_type) items.push({ label: "Personality", value: p.personality_type });
    if (p.communication_style) items.push({ label: "Communication", value: p.communication_style });
    if (p.work_style) items.push({ label: "Work style", value: p.work_style });
    if (p.relationship_status) items.push({ label: "Relationship", value: p.relationship_status });
    if (p.kids) items.push({ label: "Kids", value: p.kids });
    return items;
  }, [p]);

  const handlePhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePhotoIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profileData || !p) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Photo Carousel ──────────────────────────────── */}
        <View style={styles.carouselContainer}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handlePhotoScroll}
              scrollEventThrottle={16}
            >
              {photos.map((photo, i) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.url }}
                  style={styles.carouselPhoto}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.carouselPhoto, styles.carouselPlaceholder]}>
              <Ionicons name="person" size={64} color={COLORS.textMuted} />
            </View>
          )}

          {/* Back button overlay */}
          <SafeAreaView style={styles.backOverlay} edges={["top"]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>

            {/* Photo counter */}
            {photos.length > 1 && (
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>
                  {activePhotoIndex + 1}/{photos.length}
                </Text>
              </View>
            )}
          </SafeAreaView>

          {/* Dot indicators */}
          {photos.length > 1 && (
            <View style={styles.dotRow}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activePhotoIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── Floating Emoji Tile ─────────────────────────── */}
        <View style={styles.emojiTileWrapper}>
          <View style={styles.emojiTile}>
            <View style={styles.emojiRow}>
              {sortedEmojis.map((e) => (
                <Text
                  key={e.id}
                  style={[
                    styles.emojiChar,
                    myEmojiSet.has(e.emoji) && styles.emojiCharMatch,
                  ]}
                >
                  {e.emoji}
                </Text>
              ))}
            </View>
            {!isSelf && matchCount > 0 && (
              <View style={[styles.matchBadge, matchCount === 5 && styles.matchBadgePerfect]}>
                <Text style={[styles.matchBadgeText, matchCount === 5 && styles.matchBadgeTextPerfect]}>
                  {matchCount}/5{matchCount === 5 ? " ✨" : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Profile Details ─────────────────────────────── */}
        <View style={styles.detailsContainer}>
          {/* Name & Age */}
          <Text style={styles.nameText}>
            {p.name}, {age} {zodiac?.emoji}
          </Text>

          {/* Gender badge + New to City */}
          <View style={styles.badgeRow}>
            {genderInfo && (
              <View style={[styles.genderBadge, { backgroundColor: genderInfo.surface }]}>
                <Text style={[styles.genderBadgeText, { color: genderInfo.color }]}>
                  {genderInfo.emoji} {genderInfo.label}
                </Text>
              </View>
            )}
            {p.is_new_to_city && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>🆕 New Here</Text>
              </View>
            )}
          </View>

          {/* Location */}
          {location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{location}</Text>
            </View>
          ) : null}

          {/* Profession */}
          {p.profession ? (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{p.profession}</Text>
            </View>
          ) : null}

          {/* Pronouns */}
          {p.pronouns ? (
            <View style={styles.infoRow}>
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{p.pronouns}</Text>
            </View>
          ) : null}

          {/* ─── About Card ──────────────────────────────── */}
          {aboutItems.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              {aboutItems.map((item, i) => (
                <View key={i} style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{item.label}</Text>
                  <Text style={styles.aboutValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ─── Interests Card ──────────────────────────── */}
          {profileData.interests.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Interests</Text>
              <View style={styles.chipRow}>
                {profileData.interests.map((tag, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ─── Reveals Card ────────────────────────────── */}
          {profileData.reveals.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reveals</Text>
              {profileData.reveals.map((reveal, i) => (
                <View key={i} style={styles.revealRow}>
                  <Text style={styles.revealBullet}>{i + 1}</Text>
                  <Text style={styles.revealText}>{reveal}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ─── More Card ───────────────────────────────── */}
          {moreItems.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>More</Text>
              {moreItems.map((item, i) => (
                <View key={i} style={styles.moreRow}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={COLORS.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moreLabel}>{item.label}</Text>
                    <Text style={styles.moreValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ─── Report / Block (hidden on own profile) ── */}
          {!isSelf && (
            <View style={styles.safetySection}>
              <Pressable
                style={styles.reportButton}
                onPress={() => setShowReportModal(true)}
              >
                <Ionicons name="flag-outline" size={16} color={COLORS.accent} />
                <Text style={styles.reportButtonText}>Report</Text>
              </Pressable>
              <Pressable
                style={styles.blockButton}
                onPress={handleBlock}
              >
                <Ionicons name="ban-outline" size={16} color={COLORS.accent} />
                <Text style={styles.reportButtonText}>Block</Text>
              </Pressable>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Report Modal */}
      {userId && (
        <ReportModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          reporterId={currentUserId}
          reportedId={userId}
          reportedName={p.name}
          onComplete={() => {
            setShowReportModal(false);
            router.dismissAll();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },

  // ─── Photo Carousel ─────────────────────────────────────
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: "#E8E4DE",
  },
  carouselPhoto: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  carouselPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E4DE",
  },
  backOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCounter: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
  dotRow: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  // ─── Floating Emoji Tile ────────────────────────────────
  emojiTileWrapper: {
    alignItems: "center",
    marginTop: -22,
    zIndex: 10,
  },
  emojiTile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 6,
  },
  emojiChar: {
    fontSize: 28,
  },
  emojiCharMatch: {
    textShadowColor: COLORS.highlight,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  matchBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  matchBadgePerfect: {
    backgroundColor: COLORS.highlightSurface,
  },
  matchBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  matchBadgeTextPerfect: {
    color: COLORS.highlightDark,
  },

  // ─── Profile Details ────────────────────────────────────
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nameText: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  genderBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genderBadgeText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  newBadge: {
    backgroundColor: COLORS.highlightSurface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newBadgeText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.highlightDark,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  infoText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },

  // ─── Cards ──────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 12,
  },

  // About
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  aboutLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
  aboutValue: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },

  // Interests
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },

  // Reveals
  revealRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  revealBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primarySurface,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
    overflow: "hidden",
  },
  revealText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    lineHeight: 20,
  },

  // More
  moreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  moreLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
  moreValue: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
    marginTop: 1,
  },

  // Safety
  safetySection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  blockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reportButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.accent,
  },
});
