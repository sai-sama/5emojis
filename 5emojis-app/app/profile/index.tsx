import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { updateEmojis, updateSearchRadius, updateProfileFields } from "../../lib/profile-service";
import { getZodiacSign } from "../../lib/zodiac";
import { calculateAge } from "../../components/swipe/mockProfiles";
import EmojiPicker from "../../components/EmojiPicker";
import PreviewCard from "../../components/profile/PreviewCard";
import ShareableProfileCard from "../../components/profile/ShareableProfileCard";
import ProfileSectionRow from "../../components/profile/ProfileSectionRow";
import ProfileCompletionCard from "../../components/profile/ProfileCompletionCard";
import DiscoveryFiltersRibbon from "../../components/profile/DiscoveryFiltersRibbon";
import { fonts } from "../../lib/fonts";
import { COLORS, GENDERS, EMOJI_EDIT_COOLDOWN_HOURS, type GenderValue } from "../../lib/constants";
import { isSoundMuted, setSoundMuted } from "../../lib/sounds";
import { getProfileCompletion } from "../../lib/profile-completion";
import { resetMockData } from "../../lib/mock-data";
import { usePremium } from "../../lib/premium-context";
import { useUnread } from "../../lib/unread-context";

export default function ProfileOverview() {
  const { session, signOut, deleteAccount, isAdmin } = useAuth();
  const { isPremium } = usePremium();
  const { refresh: refreshUnread } = useUnread();
  const { profile, loading, refresh } = useProfile();

  // Gender filter — multi-select (persisted via AsyncStorage, read by SwipeCardStack)
  const ALL_GENDERS: GenderValue[] = GENDERS.map((g) => g.value);
  const [genderFilters, setGenderFilters] = useState<GenderValue[]>(ALL_GENDERS);

  useEffect(() => {
    AsyncStorage.getItem("gender_filters").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val) as GenderValue[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGenderFilters(parsed);
            return;
          }
        } catch {}
      }
      setGenderFilters(ALL_GENDERS);
    });
  }, []);

  const handleGenderToggle = (value: GenderValue) => {
    Haptics.selectionAsync();
    setGenderFilters((prev) => {
      let next: GenderValue[];
      if (prev.includes(value)) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev;
        next = prev.filter((v) => v !== value);
      } else {
        next = [...prev, value];
      }
      AsyncStorage.setItem("gender_filters", JSON.stringify(next));
      return next;
    });
  };

  // Search radius (init from profile, persisted to DB)
  const [searchRadius, setSearchRadius] = useState(
    profile?.profile.search_radius_miles ?? 50
  );
  useEffect(() => {
    if (profile) setSearchRadius(profile.profile.search_radius_miles);
  }, [profile?.profile.search_radius_miles]);

  const handleRadiusChange = async (r: number) => {
    setSearchRadius(r);
    if (session?.user) {
      await updateSearchRadius(session.user.id, r);
      refresh();
    }
  };

  // Age range filter (persisted to AsyncStorage for SwipeCardStack + DB)
  const [preferredAgeMin, setPreferredAgeMin] = useState(
    profile?.profile.preferred_age_min ?? 18
  );
  const [preferredAgeMax, setPreferredAgeMax] = useState(
    profile?.profile.preferred_age_max ?? 99
  );
  useEffect(() => {
    if (profile) {
      setPreferredAgeMin(profile.profile.preferred_age_min ?? 18);
      setPreferredAgeMax(profile.profile.preferred_age_max ?? 99);
    }
  }, [profile?.profile.preferred_age_min, profile?.profile.preferred_age_max]);

  const handleAgeChange = async (min: number, max: number) => {
    setPreferredAgeMin(min);
    setPreferredAgeMax(max);
    AsyncStorage.setItem("age_filter_min", String(min));
    AsyncStorage.setItem("age_filter_max", String(max));
    if (session?.user) {
      await updateProfileFields(session.user.id, {
        preferred_age_min: min,
        preferred_age_max: max,
      });
      refresh();
    }
  };

  // Sound mute toggle
  const [soundMuted, _setSoundMuted] = useState(isSoundMuted());

  useEffect(() => {
    // Sync from AsyncStorage on mount (isSoundMuted reads cached value,
    // but loadMuteSetting may not have run yet on first app launch)
    AsyncStorage.getItem("sound_muted").then((val) => {
      _setSoundMuted(val === "true");
    });
  }, []);

  const handleSoundToggle = () => {
    Haptics.selectionAsync();
    const next = !soundMuted;
    _setSoundMuted(next);
    setSoundMuted(next);
  };

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
    if (profile.interests.length > 0)
      parts.push(`${profile.interests.length} interest${profile.interests.length !== 1 ? "s" : ""}`);
    return parts.join(" · ") || "Tap to add details";
  }, [profile]);

  const moreSummary = useMemo(() => {
    if (!profile) return "";
    const completion = getProfileCompletion(profile);
    const moreFields = completion.total - 4; // exclude core fields (photos, emojis, profession, interests)
    const moreFilled = completion.filled - [
      profile.photos.length > 0,
      profile.emojis.length === 5,
      !!profile.profile.profession,
      profile.interests.length >= 3,
    ].filter(Boolean).length;
    return `${Math.max(0, moreFilled)} of ${moreFields} filled`;
  }, [profile]);

  const locationSummary = useMemo(() => {
    if (!profile) return "";
    const city = profile.profile.state
      ? `${profile.profile.city}, ${profile.profile.state}`
      : profile.profile.city;
    return city;
  }, [profile]);

  // ─── Emoji cooldown ────────────────────────────────────────
  const getEmojiCooldownRemaining = (): { blocked: boolean; hoursLeft: number; minutesLeft: number } => {
    const lastEdited = profile?.profile.emoji_last_edited_at;
    if (!lastEdited) return { blocked: false, hoursLeft: 0, minutesLeft: 0 };
    const elapsed = Date.now() - new Date(lastEdited).getTime();
    const cooldownMs = EMOJI_EDIT_COOLDOWN_HOURS * 60 * 60 * 1000;
    if (elapsed >= cooldownMs) return { blocked: false, hoursLeft: 0, minutesLeft: 0 };
    const remaining = cooldownMs - elapsed;
    const hoursLeft = Math.floor(remaining / (60 * 60 * 1000));
    const minutesLeft = Math.ceil((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return { blocked: true, hoursLeft, minutesLeft };
  };

  // Cooldown label for the edit button (null = no cooldown active)
  const emojiCooldownLabel = (() => {
    if (isAdmin || isPremium) return null;
    const cooldown = getEmojiCooldownRemaining();
    if (!cooldown.blocked) return null;
    return cooldown.hoursLeft > 0
      ? `${cooldown.hoursLeft}h ${cooldown.minutesLeft}m`
      : `${cooldown.minutesLeft}m`;
  })();

  const handleEditEmojis = () => {
    // Admins and premium users bypass cooldown entirely
    if (isAdmin || isPremium) {
      setEditingEmojis(sortedEmojis.map((e) => e.emoji));
      setEmojiModalVisible(true);
      return;
    }

    const cooldown = getEmojiCooldownRemaining();
    if (cooldown.blocked) {
      const timeStr = cooldown.hoursLeft > 0
        ? `${cooldown.hoursLeft}h ${cooldown.minutesLeft}m`
        : `${cooldown.minutesLeft}m`;
      Alert.alert(
        "Emoji Cooldown",
        `Free users can edit emojis once every 24 hours.\n\nYou can edit again in ${timeStr}.\n\nUpgrade to Premium for unlimited emoji edits!`,
        [
          { text: "Wait", style: "cancel" },
          {
            text: "Go Premium",
            onPress: () => router.push("/premium"),
          },
        ]
      );
      return;
    }
    setEditingEmojis(sortedEmojis.map((e) => e.emoji));
    setEmojiModalVisible(true);
  };

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

  // ─── Mock data reset ───────────────────────────────────────
  const [resettingMock, setResettingMock] = useState(false);
  const handleResetMockData = () => {
    Alert.alert(
      "Reset Mock Data",
      "This will:\n• Delete all swipes/matches/messages with mock profiles\n• Move mock profiles to your location\n• Create 5 ready-made matches (3 icebreaker pending, 2 chat active)\n• 20 incoming likes appear in \"Who Liked You\"\n• Swiping right on any = instant match\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            if (!session?.user) return;
            setResettingMock(true);
            const { error, result } = await resetMockData(session.user.id);
            setResettingMock(false);
            if (error) {
              Alert.alert("Error", error);
            } else {
              // Refresh unread badge to match new mock data
              refreshUnread();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "Done!",
                `Cleared ${result.deleted_matches} matches, ${result.deleted_swipes} swipes, ${result.deleted_messages} messages.\n\nCreated ${result.created_matches} matches with icebreakers.\nPre-seeded ${result.inserted_swipes} right swipes.\n\nCheck Friends tab for ready matches, or Discover to swipe!`
              );
            }
          },
        },
      ]
    );
  };

  // ─── Sign out ───────────────────────────────────────────────
  const handleSignOut = () => {
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

  // ─── Delete account ────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This will permanently delete your profile, photos, matches, and messages. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are you absolutely sure?",
              "All your data will be permanently removed. You'll need to create a new account to use 5Emojis again.",
              [
                { text: "Keep My Account", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeleting(true);
                    const { error } = await deleteAccount();
                    setDeleting(false);
                    if (error) {
                      Alert.alert("Error", `Failed to delete account: ${error}`);
                    } else {
                      router.replace("/(auth)/sign-in");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Preview card */}
        <PreviewCard
          profile={profile}
          sortedEmojis={sortedEmojis}
          onEditEmojis={handleEditEmojis}
          emojiCooldownLabel={emojiCooldownLabel}
        />

        {/* Share profile card */}
        <ShareableProfileCard profile={profile} sortedEmojis={sortedEmojis} />

        {/* Profile completion nudge */}
        <ProfileCompletionCard profile={profile} />

        {/* Section rows */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <ProfileSectionRow
            icon="person-outline"
            title="Personal Info"
            summary={personalSummary}
            onPress={() => router.push("/profile/personal")}
          />
          <ProfileSectionRow
            icon="camera-outline"
            title="Photos"
            summary={photoSummary}
            onPress={() => router.push("/profile/photos")}
          />
          <ProfileSectionRow
            icon="information-circle-outline"
            title="About You"
            summary={aboutSummary}
            onPress={() => router.push("/profile/about")}
          />
          <ProfileSectionRow
            icon="sparkles-outline"
            title="More About You"
            summary={moreSummary}
            onPress={() => router.push("/profile/more")}
          />
          <ProfileSectionRow
            icon="location-outline"
            title="Location"
            summary={locationSummary}
            onPress={() => router.push("/profile/location")}
          />
        </View>

        {/* Discovery Filters — collapsible ribbon */}
        <DiscoveryFiltersRibbon
          genderFilters={genderFilters}
          onGenderToggle={handleGenderToggle}
          searchRadius={searchRadius}
          onRadiusChange={handleRadiusChange}
          preferredAgeMin={preferredAgeMin}
          preferredAgeMax={preferredAgeMax}
          onAgeChange={handleAgeChange}
        />

        {/* Hidden Emojis */}
        <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          <ProfileSectionRow
            icon="eye-off-outline"
            title="Hidden Emojis"
            summary={
              (profile?.profile.hidden_emojis?.length ?? 0) > 0
                ? `${profile!.profile.hidden_emojis.length} emoji${profile!.profile.hidden_emojis.length !== 1 ? "s" : ""} hidden`
                : "None"
            }
            onPress={() => router.push("/profile/hidden-emojis")}
          />
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Legal</Text>
          </View>
          <Pressable style={styles.legalRow} onPress={() => router.push("/terms")}>
            <Text style={styles.legalRowText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>
          <Pressable style={styles.legalRow} onPress={() => router.push("/privacy")}>
            <Text style={styles.legalRowText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Admin Panel — only visible to admins */}
        {isAdmin && (
          <View style={styles.section}>
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: COLORS.primary,
                gap: 10,
              }}
              onPress={() => router.push("/admin")}
            >
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: COLORS.primary }}>
                  Admin Panel
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                  Error logs, reports, analytics
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </Pressable>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>
          <Pressable style={styles.settingsRow} onPress={handleSoundToggle}>
            <Ionicons name={soundMuted ? "volume-mute" : "volume-high"} size={18} color={COLORS.textSecondary} style={{ marginRight: 2 }} />
            <Text style={styles.settingsRowLabel}>Sound Effects</Text>
            <View
              style={[
                styles.toggle,
                soundMuted ? styles.toggleOff : styles.toggleOn,
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  soundMuted ? styles.toggleThumbOff : styles.toggleThumbOn,
                ]}
              />
            </View>
          </Pressable>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
          <Pressable
            style={[styles.deleteAccountButton, deleting && { opacity: 0.5 }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Text style={styles.deleteAccountText}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Text>
          </Pressable>
        </View>

        {/* Dev Tools — admin only */}
        {isAdmin && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🛠️</Text>
              <Text style={styles.sectionTitle}>Dev Tools</Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textMuted, marginBottom: 12 }}>
              Admin-only testing helpers
            </Text>
            <Pressable
              style={[styles.devButton, resettingMock && { opacity: 0.5 }]}
              onPress={handleResetMockData}
              disabled={resettingMock}
            >
              <Text style={styles.devButtonText}>
                {resettingMock ? "Resetting..." : "Reset Mock Data"}
              </Text>
              <Text style={styles.devButtonSubtext}>
                Clears interactions, moves 25 mock profiles to you
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Emoji Edit Modal */}
      <Modal
        visible={emojiModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          {/* Grab handle */}
          <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.disabled }} />
          </View>
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
    backgroundColor: "transparent",
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

  // Settings row
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
    gap: 10,
  },
  settingsRowIcon: {
    fontSize: 18,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: COLORS.primary,
  },
  toggleOff: {
    backgroundColor: COLORS.disabled,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  toggleThumbOff: {
    alignSelf: "flex-start",
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
  deleteAccountButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 10,
  },
  deleteAccountText: {
    color: "#DC2626",
    fontSize: 13,
    fontFamily: fonts.body,
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

  // Dev tools
  devButton: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
  },
  devButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "#EA580C",
  },
  devButtonSubtext: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
