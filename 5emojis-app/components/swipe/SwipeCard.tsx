import { memo } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { SwipeProfile, calculateAge, formatDistance } from "./mockProfiles";
import ShimmerOverlay from "../skia/ShimmerOverlay";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type SwipeCardProps = {
  profile: SwipeProfile;
  isTop: boolean;
  translateX: SharedValue<number>;
  userLat: number;
  userLng: number;
};

function SwipeCardInner({
  profile,
  isTop,
  translateX,
  userLat,
  userLng,
}: SwipeCardProps) {
  const { profile: p, emojis, photo } = profile;
  const age = calculateAge(p.dob);
  const distance = formatDistance(userLat, userLng, p.latitude, p.longitude);

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
              {p.name}, {age}
            </Text>
            {p.is_new_to_city && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeIcon}>🆕</Text>
                <Text style={styles.newBadgeText}>New Here</Text>
              </View>
            )}
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
            <Text style={[styles.stampLabel, { color: "#34D399" }]}>VIBE</Text>
          </View>
        </Animated.View>

        {/* PASS stamp */}
        <Animated.View style={[styles.stampContainer, styles.nopeStamp, nopeStyle]}>
          <View style={[styles.stampBorder, styles.passStampBorder]}>
            <Text style={styles.stampEmoji}>👋</Text>
            <Text style={[styles.stampLabel, { color: "#FB7185" }]}>PASS</Text>
          </View>
        </Animated.View>
      </View>

      {/* ═══ Emoji strip — the 5Emojis signature ═══ */}
      <View style={styles.emojiStrip}>
        <View style={styles.emojiStripInner}>
          {emojis
            .sort((a, b) => a.position - b.position)
            .map((e, i) => (
              <View
                key={e.id}
                style={[
                  styles.emojiBubble,
                  i === 2 && styles.centerEmojiBubble, // Center emoji slightly larger
                ]}
              >
                <Text style={[styles.emojiText, i === 2 && styles.centerEmojiText]}>
                  {e.emoji}
                </Text>
              </View>
            ))}
        </View>
        {/* Skia shimmer across the emoji strip */}
        <ShimmerOverlay width={SCREEN_WIDTH - 24} height={80} borderRadius={0} />
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
    borderColor: "#34D399",
    shadowColor: "#34D399",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  passGlow: {
    borderWidth: 4,
    borderColor: "#FB7185",
    shadowColor: "#FB7185",
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
    borderColor: "#34D399",
    backgroundColor: "rgba(52, 211, 153, 0.2)",
  },
  passStampBorder: {
    borderColor: "#FB7185",
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
  // ─── Emoji strip ────────────────────────────────
  emojiStrip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E4DAFF",
    // Subtle shadow on each bubble
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  centerEmojiBubble: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: "#EDE4FF",
    shadowOpacity: 0.15,
  },
  emojiText: {
    fontSize: 24,
  },
  centerEmojiText: {
    fontSize: 28,
  },
});
