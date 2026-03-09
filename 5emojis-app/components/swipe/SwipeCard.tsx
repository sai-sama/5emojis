import { memo, useMemo, useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GENDERS } from "../../lib/constants";
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
  showEmojis?: boolean;
};

function SwipeCardInner({
  profile,
  isTop,
  translateX,
  userLat,
  userLng,
  userEmojis,
  showEmojis = false,
}: SwipeCardProps) {
  const { profile: p, emojis, photo } = profile;
  const [imageError, setImageError] = useState(false);
  const age = calculateAge(p.dob);
  const zodiac = getZodiacSign(p.dob);
  const distance = formatDistance(userLat, userLng, p.latitude, p.longitude);
  const genderInfo = GENDERS.find((g) => g.value === p.gender) || GENDERS[0];

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
    <View style={styles.card} accessible accessibilityLabel={`${p.name}, age ${age}, ${distance}${p.profession ? `, ${p.profession}` : ""}`}>
      <View style={styles.photoContainer}>
        {imageError ? (
          <View style={[styles.photo, { alignItems: "center", justifyContent: "center", backgroundColor: "#2a2a2a" }]}>
            <Text style={{ fontSize: 48 }}>📸</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>Photo unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri: photo.url }}
            style={styles.photo}
            accessibilityLabel={`Photo of ${p.name}`}
            onError={() => setImageError(true)}
          />
        )}

        {/* Subtle gradient — preserve photo, readable text */}
        <LinearGradient
          colors={[
            "transparent",
            "transparent",
            "rgba(0,0,0,0.04)",
            "rgba(0,0,0,0.35)",
            "rgba(0,0,0,0.65)",
            "rgba(0,0,0,0.82)",
          ]}
          locations={[0, 0.42, 0.56, 0.72, 0.86, 1]}
          style={styles.photoGradient}
        />

        {/* Edge glows */}
        <Animated.View style={[styles.edgeGlow, styles.vibeGlow, vibeGlowStyle]} />
        <Animated.View style={[styles.edgeGlow, styles.passGlow, passGlowStyle]} />

        {/* Perfect match banner — at top of photo */}
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

        {/* Emoji overlay row — on-card, above name */}
        {showEmojis && (
          <View style={styles.emojiOverlay}>
            {emojis
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((e) => {
                const isMatch = userEmojiSet.has(e.emoji);
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.emojiChip,
                      isMatch && styles.emojiChipMatch,
                    ]}
                  >
                    <Text style={styles.emojiChipText}>{e.emoji}</Text>
                  </View>
                );
              })}
          </View>
        )}

        {/* Name / bio overlay */}
        <View style={styles.nameOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {p.name}, {age}
            </Text>
            <Text style={styles.zodiacEmoji}>{zodiac.emoji}</Text>
            <View style={[styles.genderDot, { backgroundColor: genderInfo.color }]}>
              <Text style={styles.genderDotEmoji}>{genderInfo.emoji}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            {p.profession && (
              <>
                <Text style={styles.detailText}>{p.profession}</Text>
                <Text style={styles.detailSep}>·</Text>
              </>
            )}
            <Text style={styles.detailText}>{distance}</Text>
            {p.is_new_to_city && (
              <>
                <Text style={styles.detailSep}>·</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New Here</Text>
                </View>
              </>
            )}
          </View>
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
    backgroundColor: "#000",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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
    backgroundColor: "#1a1a1a",
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
  // ─── Emoji overlay (on card, above name) ──────
  emojiOverlay: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    zIndex: 4,
  },
  emojiChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  emojiChipMatch: {
    backgroundColor: "rgba(251,191,36,0.25)",
    borderColor: COLORS.highlight,
    borderWidth: 2,
    shadowColor: COLORS.highlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  emojiChipText: {
    fontSize: 22,
  },
  // ─── Name / bio overlay ───────────────────────
  nameOverlay: {
    position: "absolute",
    bottom: 20,
    left: 18,
    right: 18,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 30,
    fontFamily: fonts.heading,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  zodiacEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  genderDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  genderDotEmoji: {
    fontSize: 11,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  detailText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: "rgba(255,255,255,0.9)",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  detailSep: {
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
  },
  newBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
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
  // ─── Perfect match banner (top of photo) ──────
  perfectBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 5,
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
});
