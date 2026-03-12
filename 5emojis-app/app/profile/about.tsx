import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { usePremium } from "../../lib/premium-context";
import { useProfile } from "../../lib/profile-context";
import { updateProfileFields, updateInterests, updateReveals } from "../../lib/profile-service";
import Chip from "../../components/profile/Chip";
import {
  FRIENDSHIP_STYLES,
  ALL_INTERESTS,
  MAX_INTERESTS,
  MAX_FRIENDSHIP_STYLES,
  getInterestSuggestions,
} from "../../lib/profile-constants";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function AboutScreen() {
  const { session } = useAuth();
  const { canAccessPremium } = usePremium();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);

  // Local editing state — initialised from profile
  const [profession, setProfession] = useState(profile?.profile.profession || "");
  const [friendshipStyles, setFriendshipStyles] = useState<string[]>(() => {
    const raw = profile?.profile.friendship_style;
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return [raw]; }
  });
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [reveals, setReveals] = useState<string[]>(() => {
    const existing = profile?.reveals ?? [];
    // Always maintain 4 slots, padding with empty strings
    return [...existing, "", "", "", ""].slice(0, 4);
  });

  const aiSuggestions = useMemo(
    () => getInterestSuggestions(profession, interests),
    [profession, interests]
  );

  // Dirty check
  const dirty = useMemo(() => {
    if (!profile) return false;
    const existingReveals = [...(profile.reveals ?? []), "", "", "", ""].slice(0, 4);
    return (
      (profession.trim() || null) !== (profile.profile.profession || null) ||
      JSON.stringify(friendshipStyles) !== JSON.stringify(
        (() => { const r = profile.profile.friendship_style; if (!r) return []; try { return JSON.parse(r); } catch { return [r]; } })()
      ) ||
      JSON.stringify([...interests].sort()) !== JSON.stringify([...profile.interests].sort()) ||
      JSON.stringify(reveals) !== JSON.stringify(existingReveals)
    );
  }, [profile, profession, friendshipStyles, interests, reveals]);

  if (!profile) return null;

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await updateProfileFields(session.user.id, {
      profession: profession.trim() || null,
      friendship_style: friendshipStyles.length > 0 ? JSON.stringify(friendshipStyles) : null,
    });
    if (error) Alert.alert("Error", error);

    await updateInterests(session.user.id, interests);
    await updateReveals(session.user.id, reveals);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await refresh();
    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About You</Text>
        <View style={{ width: 32 }}>
          {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profession */}
        <Text style={styles.fieldLabel}>What do you do?</Text>
        <TextInput
          testID="profession-input"
          value={profession}
          onChangeText={setProfession}
          placeholder="e.g. Software Engineer, Teacher"
          placeholderTextColor="#B2BEC3"
          autoCapitalize="words"
          style={styles.textInput}
        />

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

        {/* Picks for you */}
        {aiSuggestions.length > 0 && interests.length < MAX_INTERESTS && (
          <View style={styles.picksBox}>
            <Text style={styles.picksLabel}>PICKS FOR YOU</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {aiSuggestions.map((label) => {
                const interest = ALL_INTERESTS.find((i) => i.label === label);
                if (!interest) return null;
                const full = interests.length >= MAX_INTERESTS;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!interests.includes(label)) {
                        setInterests([...interests, label]);
                      }
                    }}
                    disabled={full}
                    style={[styles.pickChip, full && { opacity: 0.35 }]}
                  >
                    <Text style={{ fontSize: 11, marginRight: 3 }}>{interest.icon}</Text>
                    <Text style={styles.pickChipText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

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

        {/* Hidden Reveals */}
        <View style={styles.revealsSection}>
          <View style={styles.revealsHeader}>
            <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
            <Text style={styles.fieldLabel}>Hidden Reveals</Text>
            {!canAccessPremium && (
              <TouchableOpacity onPress={() => router.push("/premium")} style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color="#FFF" />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.revealsSubtitle}>
            {canAccessPremium
              ? "4 things people discover about you after matching"
              : "Upgrade to premium to add your own hidden reveals"}
          </Text>
          {reveals.map((reveal, index) => (
            <TextInput
              testID={`reveal-input-${index}`}
              key={index}
              value={reveal}
              onChangeText={(text) => {
                if (!canAccessPremium) {
                  router.push("/premium");
                  return;
                }
                const updated = [...reveals];
                updated[index] = text;
                setReveals(updated);
              }}
              placeholder={
                index === 0
                  ? "e.g. I can solve a Rubik's cube in under a minute"
                  : index === 1
                  ? "e.g. I've lived in 5 different countries"
                  : index === 2
                  ? "e.g. I'm secretly a great cook"
                  : "e.g. I once met a celebrity at a grocery store"
              }
              placeholderTextColor="#B2BEC3"
              maxLength={100}
              editable={canAccessPremium}
              style={[styles.revealInput, !canAccessPremium && { opacity: 0.5 }]}
            />
          ))}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky save button */}
      {dirty && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  picksBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
    maxHeight: 90,
    overflow: "hidden",
  },
  picksLabel: {
    fontSize: 10,
    fontFamily: fonts.heading,
    color: "#EA580C",
    marginBottom: 6,
  },
  pickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  pickChipText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: "#EA580C",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  revealsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  revealsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: "auto",
  },
  premiumBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
  revealsSubtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  revealInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
