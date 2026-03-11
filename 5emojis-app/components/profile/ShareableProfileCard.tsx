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
              <View style={styles.bgBlob4} />
            </View>

            {/* ── Top section: Logo + tagline ── */}
            <View style={styles.topSection}>
              <Image
                source={require("../../assets/app-icon.png")}
                style={styles.logoImage}
              />
              <View style={styles.logoTextWrap}>
                <Text style={styles.logoText}>5emojis</Text>
                <Text style={styles.logoSubtext}>Your next friend is 5 emojis away.</Text>
              </View>
            </View>

            {/* ── Profile card (glass effect) ── */}
            <View style={styles.glassCard}>
              {/* Photo + name side by side */}
              <View style={styles.profileRow}>
                {primaryPhoto ? (
                  <Image
                    key={primaryPhoto.id}
                    source={{ uri: primaryPhoto.url }}
                    style={styles.photo}
                  />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Ionicons name="person" size={32} color="rgba(255,255,255,0.5)" />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.name} numberOfLines={1}>{profile.profile.name}</Text>
                  {profile.profile.profession ? (
                    <Text style={styles.profession} numberOfLines={1}>{profile.profile.profession}</Text>
                  ) : null}
                  {locationDisplay ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.locationText}>{locationDisplay}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Emoji row — the star of the card */}
              <View style={styles.emojiSection}>
                <Text style={styles.emojiLabel}>My 5 emojis</Text>
                <View style={styles.emojiRow}>
                  {sortedEmojis.map((e) => (
                    <View key={e.id} style={styles.emojiChip}>
                      <Text style={styles.emojiChar}>{e.emoji}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── CTA label ── */}
            <Text style={styles.ctaLabel}>Find me on 5emojis</Text>

            {/* ── App store availability ── */}
            <View style={styles.storeRow}>
              <Ionicons name="logo-apple" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.storeText}>App Store</Text>
              <Text style={styles.storeDot}>·</Text>
              <Ionicons name="logo-google-playstore" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.storeText}>Google Play</Text>
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
    backgroundColor: "#2D1065",
    overflow: "hidden",
  },

  // ── Decorative background blobs ──
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgBlob1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(124, 58, 237, 0.5)",
  },
  bgBlob2: {
    position: "absolute",
    bottom: 20,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(155, 89, 240, 0.35)",
  },
  bgBlob3: {
    position: "absolute",
    top: 180,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  bgBlob4: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },

  // ── Top section: logo + tagline ──
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 13,
  },
  logoTextWrap: {
    flexShrink: 1,
  },
  logoText: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },

  // ── Glass card ──
  glassCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 24,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flexShrink: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: "#FFFFFF",
  },
  profession: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.55)",
  },

  // ── Emoji section ──
  emojiSection: {
    alignItems: "center",
  },
  emojiLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emojiChar: {
    fontSize: 26,
  },

  // ── CTA label ──
  ctaLabel: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // ── Store availability ──
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  storeText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.45)",
  },
  storeDot: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    marginHorizontal: 2,
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
