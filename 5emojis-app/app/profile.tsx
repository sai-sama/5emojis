import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useAuth } from "../lib/auth-context";
import {
  fetchFullProfile,
  updateProfileFields,
  updateLocation,
  updateSearchRadius,
  updateEmojis,
  updateInterests,
  addPhoto,
  removePhoto,
  type FullProfile,
} from "../lib/profile-service";
import EmojiPicker from "../components/EmojiPicker";
import { fonts } from "../lib/fonts";
import { COLORS } from "../lib/constants";

// ─── Constants (same as onboarding/details.tsx) ──────────────
const SITUATIONS = [
  { label: "In School", icon: "📚" },
  { label: "Working", icon: "💼" },
  { label: "Freelancing", icon: "🎨" },
  { label: "A New Parent", icon: "👶" },
  { label: "Switching Careers", icon: "🔄" },
  { label: "Retired", icon: "🌴" },
  { label: "New to the City", icon: "🏙️" },
  { label: "Taking a Gap", icon: "🌎" },
];

const FRIENDSHIP_STYLES = [
  { label: "Activity Buddy", icon: "🏃" },
  { label: "Deep Convos", icon: "💬" },
  { label: "Group Hangs", icon: "🎉" },
  { label: "Gym Partner", icon: "💪" },
  { label: "Work Friends", icon: "👔" },
  { label: "Adventure Crew", icon: "🏔️" },
  { label: "Creative Collab", icon: "🎭" },
  { label: "Study Buddy", icon: "🧠" },
];

const ALL_INTERESTS = [
  { label: "Cooking", icon: "🍳" },
  { label: "Hiking", icon: "🥾" },
  { label: "Music", icon: "🎵" },
  { label: "Gaming", icon: "🎮" },
  { label: "Travel", icon: "✈️" },
  { label: "Fitness", icon: "🏋️" },
  { label: "Reading", icon: "📖" },
  { label: "Photography", icon: "📸" },
  { label: "Art", icon: "🎨" },
  { label: "Movies", icon: "🎬" },
  { label: "Coffee", icon: "☕" },
  { label: "Yoga", icon: "🧘" },
  { label: "Dancing", icon: "💃" },
  { label: "Tech", icon: "💻" },
  { label: "Sports", icon: "⚽" },
  { label: "Fashion", icon: "👗" },
  { label: "Pets", icon: "🐕" },
  { label: "Gardening", icon: "🌱" },
  { label: "Board Games", icon: "🎲" },
  { label: "Wine", icon: "🍷" },
  { label: "Brunch", icon: "🥞" },
  { label: "Volunteering", icon: "💛" },
  { label: "Podcasts", icon: "🎧" },
  { label: "Climbing", icon: "🧗" },
];

const MAX_INTERESTS = 5;
const MAX_FRIENDSHIP_STYLES = 3;
const RADIUS_STEPS = [5, 10, 15, 25, 50, 75, 100];

// ─── Section Header ──────────────────────────────────────────
function SectionHeader({ title, emoji, action, onAction }: {
  title: string;
  emoji: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={12}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Chip Component ──────────────────────────────────────────
function Chip({ label, icon, selected, disabled, onPress }: {
  label: string;
  icon: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && !selected && styles.chipDisabled,
      ]}
    >
      <Text style={{ fontSize: 14, marginRight: 4 }}>{icon}</Text>
      <Text style={[
        styles.chipText,
        selected && styles.chipTextSelected,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ═════════════════════════════════════════════════════════════
// Main Profile Screen
// ═════════════════════════════════════════════════════════════

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [profession, setProfession] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [friendshipStyles, setFriendshipStyles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [isNewToCity, setIsNewToCity] = useState(false);
  const [searchRadius, setSearchRadius] = useState(25);

  // Emoji edit modal
  const [emojiModalVisible, setEmojiModalVisible] = useState(false);
  const [editingEmojis, setEditingEmojis] = useState<string[]>([]);

  // Location edit
  const [locationInput, setLocationInput] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  // ─── Load profile on focus ─────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!session?.user) return;
    try {
      const data = await fetchFullProfile(session.user.id);
      if (data) {
        setProfile(data);
        setProfession(data.profile.profession || "");
        setLifeStage(data.profile.life_stage || "");
        // friendship_style is stored as single value in DB,
        // but we support multiple in UI (saved as first pick)
        setFriendshipStyles(data.profile.friendship_style ? [data.profile.friendship_style] : []);
        setInterests(data.interests);
        setIsNewToCity(data.profile.is_new_to_city);
        setSearchRadius(data.profile.search_radius_miles);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  // ─── Computed ──────────────────────────────────────────────
  const primaryPhoto = profile?.photos.find((p) => p.is_primary) || profile?.photos[0];
  const sortedEmojis = [...(profile?.emojis ?? [])].sort((a, b) => a.position - b.position);
  const locationDisplay = profile
    ? profile.profile.state
      ? `${profile.profile.city}, ${profile.profile.state}`
      : profile.profile.city
    : "";

  // ─── Save handlers ─────────────────────────────────────────
  const saveDetails = async () => {
    if (!session?.user || !profile) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await updateProfileFields(session.user.id, {
      profession: profession.trim() || null,
      life_stage: lifeStage || null,
      friendship_style: friendshipStyles[0] || null,
      is_new_to_city: isNewToCity,
    });
    if (error) Alert.alert("Error", error);
    // Save interests too
    await updateInterests(session.user.id, interests);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadProfile();
  };

  const saveEmojis = async () => {
    if (!session?.user) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await updateEmojis(session.user.id, editingEmojis);
    setSaving(false);
    setEmojiModalVisible(false);
    if (error) {
      Alert.alert("Error", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadProfile();
    }
  };

  const saveLocation = async () => {
    if (!session?.user) return;
    const trimmed = locationInput.trim();
    if (!trimmed) return;

    setGeocoding(true);
    try {
      const results = await Location.geocodeAsync(trimmed);
      if (results.length === 0) {
        Alert.alert("Not found", "Couldn't find that location. Try a city name or ZIP code.");
        setGeocoding(false);
        return;
      }

      const { latitude, longitude } = results[0];
      const reverseResults = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = reverseResults[0];
      const city = place?.city || place?.subregion || trimmed;
      const state = place?.region || null;

      const { error } = await updateLocation(session.user.id, {
        city,
        state,
        latitude,
        longitude,
      });

      setGeocoding(false);
      setEditingLocation(false);
      setLocationInput("");

      if (error) {
        Alert.alert("Error", error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadProfile();
      }
    } catch {
      setGeocoding(false);
      Alert.alert("Error", "Location lookup failed. Please try again.");
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    if (!session?.user) return;
    setSearchRadius(newRadius);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateSearchRadius(session.user.id, newRadius);
  };

  const handleAddPhoto = async () => {
    if (!session?.user || !profile) return;
    if (profile.photos.length >= 5) {
      Alert.alert("Max photos", "You can have up to 5 photos.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      const position = profile.photos.length + 1;
      const { error } = await addPhoto(session.user.id, result.assets[0].uri, position);
      setSaving(false);
      if (error) {
        Alert.alert("Upload failed", error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadProfile();
      }
    }
  };

  const handleRemovePhoto = async (photoId: string, photoUrl: string) => {
    if (!profile || profile.photos.length <= 1) {
      Alert.alert("Can't remove", "You need at least one photo.");
      return;
    }
    Alert.alert("Remove photo?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          await removePhoto(photoId, photoUrl);
          setSaving(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          loadProfile();
        },
      },
    ]);
  };

  const handleSignOut = async () => {
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

  // ─── Dirty check for details ───────────────────────────────
  const detailsDirty = profile && (
    (profession.trim() || null) !== (profile.profile.profession || null) ||
    (lifeStage || null) !== (profile.profile.life_stage || null) ||
    (friendshipStyles[0] || null) !== (profile.profile.friendship_style || null) ||
    isNewToCity !== profile.profile.is_new_to_city ||
    JSON.stringify(interests.sort()) !== JSON.stringify([...profile.interests].sort())
  );

  // ─── Loading state ─────────────────────────────────────────
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
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
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
        {/* ─── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Profile Preview Card ───────────────────────── */}
        <View style={styles.previewCard}>
          <View style={styles.previewPhotoContainer}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto.url }} style={styles.previewPhoto} />
            ) : (
              <View style={[styles.previewPhoto, styles.photoPlaceholder]}>
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
            )}
            {isNewToCity && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>🆕 New</Text>
              </View>
            )}
          </View>
          <Text style={styles.previewName}>{profile.profile.name}</Text>
          {profile.profile.profession && (
            <Text style={styles.previewProfession}>{profile.profile.profession}</Text>
          )}
          <Text style={styles.previewLocation}>📍 {locationDisplay}</Text>
          <View style={styles.previewEmojiRow}>
            {sortedEmojis.map((e) => (
              <Text key={e.id} style={styles.previewEmoji}>{e.emoji}</Text>
            ))}
          </View>
        </View>

        {/* ─── Photos Section ─────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Photos" emoji="📷" action="Add" onAction={handleAddPhoto} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}
          >
            {profile.photos.map((photo, i) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
                {i === 0 && (
                  <View style={styles.primaryLabel}>
                    <Text style={styles.primaryLabelText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => handleRemovePhoto(photo.id, photo.url)}
                >
                  <Text style={{ color: "#FFF", fontSize: 11, fontFamily: fonts.bodyBold }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {profile.photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoSlot} onPress={handleAddPhoto}>
                <Text style={{ fontSize: 28 }}>📸</Text>
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ─── Emojis Section ─────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Your 5 Emojis"
            emoji="✨"
            action="Edit"
            onAction={() => {
              setEditingEmojis(sortedEmojis.map((e) => e.emoji));
              setEmojiModalVisible(true);
            }}
          />
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

        {/* ─── About You Section ──────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="About You" emoji="💼" />

          {/* Profession */}
          <Text style={styles.fieldLabel}>What do you do?</Text>
          <TextInput
            value={profession}
            onChangeText={setProfession}
            placeholder="e.g. Software Engineer, Teacher"
            placeholderTextColor="#B2BEC3"
            autoCapitalize="words"
            style={styles.textInput}
          />

          {/* Life Stage */}
          <Text style={styles.fieldLabel}>I'm currently...</Text>
          <View style={styles.chipGrid}>
            {SITUATIONS.map(({ label, icon }) => (
              <Chip
                key={label}
                label={label}
                icon={icon}
                selected={lifeStage === label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLifeStage(lifeStage === label ? "" : label);
                }}
              />
            ))}
          </View>

          {/* Friendship Styles */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Looking for</Text>
            <Text style={styles.fieldCount}>{friendshipStyles.length}/{MAX_FRIENDSHIP_STYLES}</Text>
          </View>
          <View style={styles.chipGrid}>
            {FRIENDSHIP_STYLES.map(({ label, icon }) => {
              const sel = friendshipStyles.includes(label);
              const full = !sel && friendshipStyles.length >= MAX_FRIENDSHIP_STYLES;
              return (
                <Chip
                  key={label}
                  label={label}
                  icon={icon}
                  selected={sel}
                  disabled={full}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (sel) {
                      setFriendshipStyles(friendshipStyles.filter((s) => s !== label));
                    } else {
                      setFriendshipStyles([...friendshipStyles, label]);
                    }
                  }}
                />
              );
            })}
          </View>

          {/* Interests */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Interests</Text>
            <Text style={styles.fieldCount}>{interests.length}/{MAX_INTERESTS}</Text>
          </View>
          <View style={styles.chipGrid}>
            {ALL_INTERESTS.map(({ label, icon }) => {
              const sel = interests.includes(label);
              const full = !sel && interests.length >= MAX_INTERESTS;
              return (
                <Chip
                  key={label}
                  label={label}
                  icon={icon}
                  selected={sel}
                  disabled={full}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (sel) {
                      setInterests(interests.filter((i) => i !== label));
                    } else {
                      setInterests([...interests, label]);
                    }
                  }}
                />
              );
            })}
          </View>

          {/* Save button — only shows when dirty */}
          {detailsDirty && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveDetails}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Location Section ───────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Location"
            emoji="📍"
            action={editingLocation ? "Cancel" : "Change"}
            onAction={() => {
              setEditingLocation(!editingLocation);
              setLocationInput("");
            }}
          />

          <View style={styles.locationInfo}>
            <Text style={styles.locationCity}>{locationDisplay}</Text>
          </View>

          {editingLocation && (
            <View style={{ marginTop: 12 }}>
              <TextInput
                value={locationInput}
                onChangeText={setLocationInput}
                placeholder="Enter city or ZIP code"
                placeholderTextColor="#B2BEC3"
                autoFocus
                autoCapitalize="words"
                style={styles.textInput}
              />
              <TouchableOpacity
                style={[styles.saveButton, { marginTop: 8 }]}
                onPress={saveLocation}
                disabled={geocoding || !locationInput.trim()}
              >
                {geocoding ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Update Location</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Search radius */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Search radius</Text>
          <View style={styles.radiusRow}>
            {RADIUS_STEPS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => handleRadiusChange(r)}
                style={[
                  styles.radiusChip,
                  searchRadius === r && styles.radiusChipActive,
                ]}
              >
                <Text style={[
                  styles.radiusChipText,
                  searchRadius === r && styles.radiusChipTextActive,
                ]}>
                  {r}mi
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New to city toggle */}
          <Pressable
            style={[
              styles.toggleRow,
              isNewToCity && styles.toggleRowActive,
            ]}
            onPress={() => {
              setIsNewToCity(!isNewToCity);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>🆕  New to this city?</Text>
              <Text style={styles.toggleSub}>Show a badge so locals know you're looking to meet people</Text>
            </View>
            <View style={[styles.toggleDot, isNewToCity && styles.toggleDotActive]}>
              {isNewToCity && <Text style={{ fontSize: 10 }}>✓</Text>}
            </View>
          </Pressable>
        </View>

        {/* ─── Legal Section ──────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Legal" emoji="📋" />
          <Pressable style={styles.legalRow} onPress={() => router.push("/terms")}>
            <Text style={styles.legalRowText}>Terms of Service</Text>
            <Text style={styles.legalChevron}>›</Text>
          </Pressable>
          <Pressable style={styles.legalRow} onPress={() => router.push("/privacy")}>
            <Text style={styles.legalRowText}>Privacy Policy</Text>
            <Text style={styles.legalChevron}>›</Text>
          </Pressable>
        </View>

        {/* ─── Account Section ────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Account" emoji="⚙️" />
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ─── Emoji Edit Modal ─────────────────────────────── */}
      <Modal
        visible={emojiModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEmojiModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Emojis</Text>
            <TouchableOpacity
              onPress={saveEmojis}
              disabled={editingEmojis.length !== 5 || saving}
            >
              <Text style={[
                styles.modalSave,
                editingEmojis.length !== 5 && { opacity: 0.4 },
              ]}>
                {saving ? "..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected slots */}
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
                  {emoji ? (
                    <Text style={{ fontSize: 32 }}>{emoji}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Emoji picker */}
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

// ═════════════════════════════════════════════════════════════
// Styles
// ═════════════════════════════════════════════════════════════
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

  // Preview card
  previewCard: {
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
  previewPhotoContainer: {
    position: "relative",
    marginBottom: 12,
  },
  previewPhoto: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: "#F0EDE8",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
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
  newBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
  },
  previewName: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  previewProfession: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  previewLocation: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  previewEmojiRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  previewEmoji: {
    fontSize: 28,
  },

  // Section
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
  sectionEmoji: {
    fontSize: 18,
    marginRight: 8,
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

  // Photos
  photoStrip: {
    gap: 10,
    paddingRight: 4,
  },
  photoCard: {
    width: 90,
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  primaryLabel: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryLabelText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoSlot: {
    width: 90,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
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
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5,
    borderColor: "#E4DAFF",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPlaceholder: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  fieldCount: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  // Chips
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: "#F5F0FF",
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },

  // Save
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },

  // Location
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationCity: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  radiusRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  radiusChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radiusChipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  radiusChipTextActive: {
    color: "#FFF",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  toggleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F5F0FF",
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  toggleDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Sign out
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
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 16,
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
    backgroundColor: "#F5F0FF",
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
