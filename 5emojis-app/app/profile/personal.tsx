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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { updateProfileFields } from "../../lib/profile-service";
import { getZodiacSign } from "../../lib/zodiac";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "They/Them", "Other"];

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dob: string): string {
  const d = new Date(dob);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function PersonalScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState(profile?.profile.name || "");
  const [pronouns, setPronouns] = useState(profile?.profile.pronouns || "");

  // DOB is read-only
  const dob = profile?.profile.dob || "";
  const age = dob ? calculateAge(dob) : 0;
  const zodiac = dob ? getZodiacSign(dob) : null;

  // Dirty check
  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      name.trim() !== profile.profile.name ||
      (pronouns || null) !== (profile.profile.pronouns || null)
    );
  }, [profile, name, pronouns]);

  if (!profile) return null;

  const handleSave = async () => {
    if (!session?.user) return;
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { error } = await updateProfileFields(session.user.id, {
      name: name.trim(),
      pronouns: pronouns || null,
    });

    setSaving(false);
    if (error) {
      Alert.alert("Error", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Info</Text>
        <View style={{ width: 32 }}>
          {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name — editable */}
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor="#B2BEC3"
          autoCapitalize="words"
          style={styles.textInput}
        />

        {/* Birthday — read-only */}
        <Text style={styles.fieldLabel}>Birthday</Text>
        <View style={styles.dobReadOnly}>
          <Text style={{ fontSize: 20, marginRight: 12 }}>🎂</Text>
          <Text style={styles.dobText}>{dob ? formatDate(dob) : "Not set"}</Text>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>🔒 Set during signup</Text>
          </View>
        </View>

        {/* Zodiac + Age */}
        {zodiac && (
          <View style={styles.zodiacCard}>
            <Text style={{ fontSize: 36 }}>{zodiac.emoji}</Text>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.zodiacSign}>{zodiac.sign}</Text>
              <Text style={styles.zodiacAge}>{age} years old</Text>
            </View>
          </View>
        )}

        {/* Pronouns — editable */}
        <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Pronouns</Text>
        <View style={styles.chipGrid}>
          {PRONOUNS_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPronouns(pronouns === p ? "" : p);
              }}
              style={[
                styles.chip,
                pronouns === p && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  pronouns === p && styles.chipTextSelected,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sticky save */}
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
    backgroundColor: COLORS.background,
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
    marginBottom: 20,
  },
  dobReadOnly: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  dobText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  lockedBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },
  zodiacCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primarySurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: 4,
  },
  zodiacSign: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.primary,
  },
  zodiacAge: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
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
