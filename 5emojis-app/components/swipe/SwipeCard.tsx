import { memo, useMemo } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, INTENTS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { getZodiacSign } from "../../lib/zodiac";
import { SwipeProfile, calculateAge, formatDistance } from "./mockProfiles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type SwipeCardProps = {
  profile: SwipeProfile;
  isTop: boolean;
  translateX: SharedValue<number>;
  userLat: number;
  userLng: number;
  userEmojis: string[];
};

function SwipeCardInner({
  profile,
  isTop,
  translateX,
  userLat,
  userLng,
  userEmojis,
}: SwipeCardProps) {
  const { profile: p, emojis, photo } = profile;
  const age = calculateAge(p.dob);
  const zodiac = getZodiacSign(p.dob);
  const distance = formatDistance(userLat, userLng, p.latitude, p.longitude);
  const intentInfo = INTENTS.find((i) => i.value === p.intent) || INTENTS[2];

  // ─── Emoji match calculation ─────────────────────────────
  const userEmojiSet = useMemo(() => new Set(userEmojis), [userEmojis]);
  const matchCount = useMemo(
    () => emojis.filter((e) => userEmojiSet.has(e.emoji)).length,
    [emojis, userEmojiSet]
  );
  const isPerfectMatch = matchCount === 5;

  // ─── VIBE stamp (swipe right) ──────────────────────────────
  const likeStyle = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.6],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD * 1.5],
      [0.5, 1, 1.15],
      Extrapolation.CLAMP
    );
    const rotate = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [-20, -12],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  // ─── PASS stamp (swipe left) ───────────────────────────────
  const nopeStyle = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.6, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD * 0.6, 0],
      [1.15, 1, 0.5],
      Extrapolation.CLAMP
    );
    const rotate = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [12, 20],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }, { rotate: `${rotate}deg` }],
    };
  });

  // ─── Edge glow — green/red tint on card edges during drag ──
  const vibeGlowStyle = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.8],
      [0, 0.25],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const passGlowStyle = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.8, 0],
      [0.25, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={styles.card}>
      {/* Photo — takes most of the card */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: photo.url }} style={styles.photo} />

        {/* Multi-stop gradient for premium depth */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.08)",
            "transparent",
            "transparent",
            "rgba(0,0,0,0.5)",
            "rgba(0,0,0,0.75)",
          ]}
          locations={[0, 0.15, 0.4, 0.75, 1]}
          style={styles.photoGradient}
        />

        {/* Vibe glow (green edge) */}
        <Animated.View style={[styles.edgeGlow, styles.vibeGlow, vibeGlowStyle]} />

        {/* Pass glow (red edge) */}
        <Animated.View style={[styles.edgeGlow, styles.passGlow, passGlowStyle]} />

        {/* Name overlay on photo */}
        <View style={styles.nameOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {p.name}, {age} {zodiac.emoji}
            </Text>
            {p.is_new_to_city && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeIcon}>🆕</Text>
                <Text style={styles.newBadgeText}>New Here</Text>
              </View>
            )}
          </View>
          <View style={[styles.intentBadge, { backgroundColor: intentInfo.color }]}>
            <Text style={styles.intentEmoji}>{intentInfo.emoji}</Text>
            <Text style={styles.intentLabel}>{intentInfo.label}</Text>
          </View>
          {p.profession && (
            <Text style={styles.profession}>💼 {p.profession}</Text>
          )}
          <Text style={styles.distance}>📍 {distance}</Text>
        </View>

        {/* VIBE stamp */}
        <Animated.View style={[styles.stampContainer, styles.likeStamp, likeStyle]}>
          <View style={[styles.stampBorder, styles.vibeStampBorder]}>
            <Text style={styles.stampEmoji}>🤝</Text>
            <Text style={[styles.stampLabel, { color: COLORS.vibe }]}>VIBE</Text>
          </View>
        </Animated.View>

        {/* PASS stamp */}
        <Animated.View style={[styles.stampContainer, styles.nopeStamp, nopeStyle]}>
          <View style={[styles.stampBorder, styles.passStampBorder]}>
            <Text style={styles.stampEmoji}>👋</Text>
            <Text style={[styles.stampLabel, { color: COLORS.pass }]}>PASS</Text>
          </View>
        </Animated.View>
      </View>

      {/* ═══ Emoji match banner (perfect 5/5 only) ═══ */}
      {isPerfectMatch && (
        <LinearGradient
          colors={[COLORS.highlight, COLORS.highlightDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.perfectBanner}
        >
          <Text style={styles.perfectBannerText}>
            PERFECT EMOJI MATCH
          </Text>
        </LinearGradient>
      )}

      {/* ═══ Emoji strip — the 5Emojis signature ═══ */}
      <View style={styles.emojiStrip}>
        <View style={styles.emojiStripInner}>
          {emojis
            .sort((a, b) => a.position - b.position)
            .map((e, i) => {
              const isMatch = userEmojiSet.has(e.emoji);
              const bubbleSize = 56 - i * 4; // 56, 52, 48, 44, 40
              const emojiSize = 28 - i * 2;  // 28, 26, 24, 22, 20
              return (
                <View
                  key={e.id}
                  style={[
                    styles.emojiBubble,
                    { width: bubbleSize, height: bubbleSize },
                    isMatch && styles.matchEmojiBubble,
                  ]}
                >
                  <Text style={{ fontSize: emojiSize }}>
                    {e.emoji}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>
    </View>
  );
}

export const SwipeCard = memo(SwipeCardInner);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    // Premium layered shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    // Subtle border for definition
    borderWidth: Platform.OS === "ios" ? 0.5 : 0,
    borderColor: "rgba(0,0,0,0.06)",
  },
  photoContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#F0EDE8",
  },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  edgeGlow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "100%",
    borderRadius: 24,
  },
  vibeGlow: {
    borderWidth: 4,
    borderColor: COLORS.vibe,
    shadowColor: COLORS.vibe,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  passGlow: {
    borderWidth: 4,
    borderColor: COLORS.pass,
    shadowColor: COLORS.pass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  nameOverlay: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 3,
  },
  newBadgeIcon: {
    fontSize: 11,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  intentBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    marginTop: 6,
  },
  intentEmoji: {
    fontSize: 13,
  },
  intentLabel: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profession: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: "rgba(255,255,255,0.92)",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  distance: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // ─── Stamps ─────────────────────────────────────
  stampContainer: {
    position: "absolute",
    top: 28,
    zIndex: 10,
  },
  likeStamp: {
    left: 20,
  },
  nopeStamp: {
    right: 20,
  },
  stampBorder: {
    borderWidth: 4,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  vibeStampBorder: {
    borderColor: COLORS.vibe,
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  passStampBorder: {
    borderColor: COLORS.pass,
    backgroundColor: "rgba(251, 113, 133, 0.2)",
  },
  stampEmoji: {
    fontSize: 28,
  },
  stampLabel: {
    fontSize: 18,
    fontFamily: fonts.heading,
    letterSpacing: 3,
    marginTop: -2,
  },
  // ─── Match banner / indicator ──────────────────
  perfectBanner: {
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: COLORS.highlight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  perfectBannerText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: fonts.heading,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // ─── Emoji strip ────────────────────────────────
  emojiStrip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    // Top inner shadow for depth
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  emojiStripInner: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
  },
  emojiBubble: {
    borderRadius: 16,
    backgroundColor: COLORS.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    // Subtle shadow on each bubble
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // ─── Matching emoji highlight ─────────────────
  matchEmojiBubble: {
    backgroundColor: COLORS.highlightSurface,
    borderColor: COLORS.highlight,
    borderWidth: 2,
    shadowColor: COLORS.highlight,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
