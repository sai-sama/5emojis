import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import type { FullProfile } from "../../lib/profile-service";
import type { ProfileEmoji } from "../../lib/types";

type Props = {
  profile: FullProfile;
  sortedEmojis: ProfileEmoji[];
  onEditEmojis?: () => void;
};

export default function PreviewCard({ profile, sortedEmojis, onEditEmojis }: Props) {
  const primaryPhoto =
    profile.photos.find((p) => p.is_primary) || profile.photos[0];
  const locationDisplay = profile.profile.state
    ? `${profile.profile.city}, ${profile.profile.state}`
    : profile.profile.city;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.photoContainer}
        onPress={() => router.push(`/user/${profile.profile.id}`)}
      >
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto.url }} style={styles.photo} />
        ) : (
          <Pressable
            style={[styles.photo, styles.placeholder]}
            onPress={() => router.push("/profile/photos")}
          >
            <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
            <Text style={{ fontSize: 10, fontFamily: fonts.bodySemiBold, color: COLORS.primary, marginTop: 2 }}>
              Add photo
            </Text>
          </Pressable>
        )}
        {profile.profile.is_new_to_city && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🆕 New</Text>
          </View>
        )}
        <View style={styles.previewBadge}>
          <Ionicons name="eye-outline" size={12} color="#FFF" />
        </View>
      </Pressable>
      <Text style={styles.name}>{profile.profile.name}</Text>
      {profile.profile.profession ? (
        <Text style={styles.profession}>{profile.profile.profession}</Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
        <Text style={[styles.location, { marginTop: 0, marginLeft: 3 }]}>{locationDisplay}</Text>
      </View>
      {onEditEmojis ? (
        <TouchableOpacity
          style={styles.emojiBox}
          activeOpacity={0.7}
          onPress={onEditEmojis}
        >
          <View style={styles.emojiBoxLeft}>
            {sortedEmojis.map((e) => (
              <Text key={e.id} style={styles.emoji}>
                {e.emoji}
              </Text>
            ))}
          </View>
          <View style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.emojiRow}>
          {sortedEmojis.map((e) => (
            <Text key={e.id} style={styles.emoji}>
              {e.emoji}
            </Text>
          ))}
        </View>
      )}
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
  previewBadge: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  emojiBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginTop: 14,
    backgroundColor: COLORS.primarySurface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
  },
  emojiBoxLeft: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  emoji: {
    fontSize: 26,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 10,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
});
