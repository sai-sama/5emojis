import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { updateEmojis } from "../../lib/profile-service";
import { getZodiacSign } from "../../lib/zodiac";
import { calculateAge } from "../../components/swipe/mockProfiles";
import EmojiPicker from "../../components/EmojiPicker";
import PreviewCard from "../../components/profile/PreviewCard";
import ProfileSectionRow from "../../components/profile/ProfileSectionRow";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function ProfileOverview() {
  const { session, signOut } = useAuth();
  const { profile, loading, refresh } = useProfile();

  // Emoji modal
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [editingEmojis, setEditingEmojis] = useState<string[]>([]);
  const [savingEmojis, setSavingEmojis] = useState(false);

  const sortedEmojis = useMemo(
    () => [...(profile?.emojis ?? [])].sort((a, b) => a.position - b.position),
    [profile?.emojis]
  );

  // ─── Summaries for section rows ─────────────────────────────
  const photoSummary = profile
    ? `${profile.photos.length} photo${profile.photos.length !== 1 ? "s" : ""}`
    : "";

  const personalSummary = useMemo(() => {
    if (!profile) return "";
    const parts: string[] = [profile.profile.name];
    if (profile.profile.dob) {
      const zodiac = getZodiacSign(profile.profile.dob);
      parts.push(`${calculateAge(profile.profile.dob)}`);
      parts.push(`${zodiac.emoji} ${zodiac.sign}`);
    }
    if (profile.profile.pronouns) parts.push(profile.profile.pronouns);
    return parts.join(" · ");
  }, [profile]);

  const aboutSummary = useMemo(() => {
    if (!profile) return "";
    const parts: string[] = [];
    if (profile.profile.profession) parts.push(profile.profile.profession);
    if (profile.profile.life_stage) parts.push(profile.profile.life_stage);
    if (profile.interests.length > 0)
      parts.push(`${profile.interests.length} interest${profile.interests.length !== 1 ? "s" : ""}`);
    return parts.join(" · ") || "Tap to add details";
  }, [profile]);

  const locationSummary = useMemo(() => {
    if (!profile) return "";
    const city = profile.profile.state
      ? `${profile.profile.city}, ${profile.profile.state}`
      : profile.profile.city;
    return `${city} · ${profile.profile.search_radius_miles}mi`;
  }, [profile]);

  // ─── Emoji save ─────────────────────────────────────────────
  const saveEmojis = async () => {
    if (!session?.user) return;
    setSavingEmojis(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await updateEmojis(session.user.id, editingEmojis);
    setSavingEmojis(false);
    setEmojiModalVisible(false);
    if (error) {
      // silent — profile will refresh
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    refresh();
  };

  // ─── Sign out ───────────────────────────────────────────────
  const handleSignOut = () => {
    const { Alert } = require("react-native");
    Alert.alert("Sign out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>😕</Text>
          <Text style={styles.emptyTitle}>Profile not found</Text>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Preview card */}
        <PreviewCard profile={profile} sortedEmojis={sortedEmojis} />

        {/* Section rows */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <ProfileSectionRow
            icon="🪪"
            title="Personal Info"
            summary={personalSummary}
            onPress={() => router.push("/profile/personal")}
          />
          <ProfileSectionRow
            icon="📸"
            title="Photos"
            summary={photoSummary}
            onPress={() => router.push("/profile/photos")}
          />
          <ProfileSectionRow
            icon="👤"
            title="About You"
            summary={aboutSummary}
            onPress={() => router.push("/profile/about")}
          />
          <ProfileSectionRow
            icon="📍"
            title="Location"
            summary={locationSummary}
            onPress={() => router.push("/profile/location")}
          />
        </View>

        {/* Emojis — inline with modal picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>✨</Text>
            <Text style={styles.sectionTitle}>Your 5 Emojis</Text>
            <TouchableOpacity
              hitSlop={12}
              onPress={() => {
                setEditingEmojis(sortedEmojis.map((e) => e.emoji));
                setEmojiModalVisible(true);
              }}
            >
              <Text style={styles.sectionAction}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Pressable
            style={styles.emojiDisplay}
            onPress={() => {
              setEditingEmojis(sortedEmojis.map((e) => e.emoji));
              setEmojiModalVisible(true);
            }}
          >
            {sortedEmojis.map((e) => (
              <View key={e.id} style={styles.emojiSlot}>
                <Text style={{ fontSize: 36 }}>{e.emoji}</Text>
              </View>
            ))}
            {sortedEmojis.length === 0 && (
              <Text style={styles.emojiPlaceholder}>Tap to pick your emojis</Text>
            )}
          </Pressable>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>📋</Text>
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>
          <Pressable style={styles.legalRow} onPress={() => router.push("/terms")}>
            <Text style={styles.legalRowText}>Terms of Service</Text>
            <Text style={styles.legalChevron}>›</Text>
          </Pressable>
          <Pressable style={styles.legalRow} onPress={() => router.push("/privacy")}>
            <Text style={styles.legalRowText}>Privacy Policy</Text>
            <Text style={styles.legalChevron}>›</Text>
          </Pressable>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>⚙️</Text>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Emoji Edit Modal */}
      <Modal
        visible={emojiModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEmojiModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Emojis</Text>
            <TouchableOpacity
              onPress={saveEmojis}
              disabled={editingEmojis.length !== 5 || savingEmojis}
            >
              <Text
                style={[
                  styles.modalSave,
                  editingEmojis.length !== 5 && { opacity: 0.4 },
                ]}
              >
                {savingEmojis ? "..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalSlots}>
            {Array.from({ length: 5 }).map((_, i) => {
              const emoji = editingEmojis[i];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    if (emoji) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setEditingEmojis(editingEmojis.filter((_, idx) => idx !== i));
                    }
                  }}
                  style={[
                    styles.emojiEditSlot,
                    emoji ? styles.emojiEditSlotFilled : styles.emojiEditSlotEmpty,
                  ]}
                >
                  {emoji ? <Text style={{ fontSize: 32 }}>{emoji}</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flex: 1 }}>
            <EmojiPicker
              selected={editingEmojis}
              onToggle={(emoji) => {
                if (editingEmojis.includes(emoji)) {
                  setEditingEmojis(editingEmojis.filter((e) => e !== emoji));
                } else if (editingEmojis.length < 5) {
                  const next = [...editingEmojis, emoji];
                  setEditingEmojis(next);
                  if (next.length === 5) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }
              }}
              onSetAll={setEditingEmojis}
              maxSelection={5}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: COLORS.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 16,
  },

  // Section card
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    flex: 1,
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },

  // Emojis
  emojiDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  emojiSlot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPlaceholder: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },

  // Legal
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  legalRowText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
  },
  legalChevron: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: "300",
  },

  // Sign out
  signOutButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },

  // Emoji modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  modalSave: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  modalSlots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  emojiEditSlot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiEditSlotFilled: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emojiEditSlotEmpty: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
  },
});
