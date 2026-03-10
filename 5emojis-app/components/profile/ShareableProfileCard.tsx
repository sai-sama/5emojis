import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Share,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import type { FullProfile } from "../../lib/profile-service";
import type { ProfileEmoji } from "../../lib/types";

type Props = {
  profile: FullProfile;
  sortedEmojis: ProfileEmoji[];
};

export default function ShareableProfileCard({ profile, sortedEmojis }: Props) {
  const viewShotRef = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const primaryPhoto =
    profile.photos.find((p) => p.is_primary) || profile.photos[0];
  const locationDisplay = profile.profile.state
    ? `${profile.profile.city}, ${profile.profile.state}`
    : profile.profile.city;

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          UTI: "public.png",
        });
      } else {
        // Fallback for simulators / unsupported
        await Share.share({ url: uri });
      }
    } catch (err) {
      // User cancelled or sharing unavailable — ignore
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  return (
    <View style={styles.wrapper}>
      {/* Hidden capture view — rendered off-screen at higher quality */}
      <View style={styles.captureContainer}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1, result: "tmpfile" }}
        >
          <View style={styles.card}>
            {/* ── Gradient background ── */}
            <View style={styles.bgGradient}>
              <View style={styles.bgBlob1} />
              <View style={styles.bgBlob2} />
              <View style={styles.bgBlob3} />
            </View>

            {/* ── Logo — front and center ── */}
            <View style={styles.logoSection}>
              <Image
                source={require("../../assets/app-icon.png")}
                style={styles.logoImage}
              />
              <Text style={styles.logoText}>5emojis</Text>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Profile section ── */}
            <View style={styles.profileSection}>
              {primaryPhoto ? (
                <Image
                  source={{ uri: primaryPhoto.url }}
                  style={styles.photo}
                />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="person" size={40} color={COLORS.primarySoft} />
                </View>
              )}

              <Text style={styles.name}>{profile.profile.name}</Text>

              {profile.profile.profession ? (
                <Text style={styles.profession}>{profile.profile.profession}</Text>
              ) : null}

              {locationDisplay ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.locationText}>{locationDisplay}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Emoji row ── */}
            <View style={styles.emojiCard}>
              {sortedEmojis.map((e, i) => (
                <View key={e.id} style={styles.emojiChip}>
                  <Text style={styles.emojiChar}>{e.emoji}</Text>
                </View>
              ))}
            </View>

            {/* ── Tagline ── */}
            <Text style={styles.tagline}>Stop overthinking. Just send 5 emojis.</Text>

            {/* ── CTA ── */}
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaText}>Find me on 5emojis</Text>
            </View>
          </View>
        </ViewShot>
      </View>

      {/* ── Share button (visible to user) ── */}
      <Pressable
        style={styles.shareButton}
        onPress={handleShare}
        disabled={sharing}
      >
        {sharing ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <Ionicons name="share-outline" size={18} color="#FFF" />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const CARD_WIDTH = 360;
const CARD_PADDING = 32;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },

  // Hide the capture view off-screen but keep it rendered
  captureContainer: {
    position: "absolute",
    left: -9999,
    top: 0,
  },

  // ── The actual card that gets captured ──
  card: {
    width: CARD_WIDTH,
    paddingHorizontal: CARD_PADDING,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: "center",
    backgroundColor: "#4A1D96",
    overflow: "hidden",
  },

  // ── Decorative background blobs ──
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgBlob1: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(124, 58, 237, 0.6)",
  },
  bgBlob2: {
    position: "absolute",
    bottom: 40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(155, 89, 240, 0.4)",
  },
  bgBlob3: {
    position: "absolute",
    top: 120,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
  },

  // ── Logo section ──
  logoSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontFamily: fonts.headingBold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  // ── Divider ──
  divider: {
    width: 48,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1,
    marginBottom: 24,
  },

  // ── Profile section ──
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  profession: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.65)",
  },

  // ── Emoji row ──
  emojiCard: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  emojiChip: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  emojiChar: {
    fontSize: 28,
  },

  // ── Tagline ──
  tagline: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  // ── CTA badge ──
  ctaBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // ── Share button ──
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shareButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "#FFFFFF",
  },
});
