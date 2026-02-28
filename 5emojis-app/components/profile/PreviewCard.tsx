import { View, Text, Image, StyleSheet } from "react-native";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import type { FullProfile } from "../../lib/profile-service";
import type { ProfileEmoji } from "../../lib/types";

type Props = {
  profile: FullProfile;
  sortedEmojis: ProfileEmoji[];
};

export default function PreviewCard({ profile, sortedEmojis }: Props) {
  const primaryPhoto =
    profile.photos.find((p) => p.is_primary) || profile.photos[0];
  const locationDisplay = profile.profile.state
    ? `${profile.profile.city}, ${profile.profile.state}`
    : profile.profile.city;

  return (
    <View style={styles.card}>
      <View style={styles.photoContainer}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
        )}
        {profile.profile.is_new_to_city && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🆕 New</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{profile.profile.name}</Text>
      {profile.profile.profession ? (
        <Text style={styles.profession}>{profile.profile.profession}</Text>
      ) : null}
      <Text style={styles.location}>📍 {locationDisplay}</Text>
      <View style={styles.emojiRow}>
        {sortedEmojis.map((e) => (
          <Text key={e.id} style={styles.emoji}>
            {e.emoji}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 12,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: "#F0EDE8",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  profession: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  emoji: {
    fontSize: 28,
  },
});
