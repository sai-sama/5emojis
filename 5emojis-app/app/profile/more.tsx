import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import {
  updateProfileFields,
  updateAvailability,
  updatePets,
  updateDietary,
} from "../../lib/profile-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import {
  AVAILABILITY_SLOTS,
  MAX_AVAILABILITY,
  PERSONALITY_TYPES,
  COMMUNICATION_STYLES,
  KIDS_OPTIONS,
  PETS_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  WORK_STYLE_OPTIONS,
  DIETARY_OPTIONS,
} from "../../lib/profile-constants";

export default function MoreAboutYou() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);

  // ─── Local state from profile ──────────────────────────────
  const [availability, setAvailability] = useState<string[]>(profile?.availability ?? []);
  const [personalityType, setPersonalityType] = useState(profile?.profile.personality_type ?? "");
  const [communicationStyle, setCommunicationStyle] = useState(profile?.profile.communication_style ?? "");
  const [kids, setKids] = useState(profile?.profile.kids ?? "");
  const [pets, setPets] = useState<string[]>(profile?.pets ?? []);
  const [relationshipStatus, setRelationshipStatus] = useState(profile?.profile.relationship_status ?? "");
  const [workStyle, setWorkStyle] = useState(profile?.profile.work_style ?? "");
  const [dietary, setDietary] = useState<string[]>(profile?.dietary ?? []);

  // ─── Dirty check ──────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!profile) return false;
    const p = profile.profile;
    return (
      JSON.stringify(availability) !== JSON.stringify(profile.availability) ||
      personalityType !== (p.personality_type ?? "") ||
      communicationStyle !== (p.communication_style ?? "") ||
      kids !== (p.kids ?? "") ||
      JSON.stringify(pets) !== JSON.stringify(profile.pets) ||
      relationshipStatus !== (p.relationship_status ?? "") ||
      workStyle !== (p.work_style ?? "") ||
      JSON.stringify(dietary) !== JSON.stringify(profile.dietary)
    );
  }, [profile, availability, personalityType, communicationStyle, kids, pets, relationshipStatus, workStyle, dietary]);

  // ─── Toggle helpers ───────────────────────────────────────
  const toggleAvailability = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (availability.includes(value)) {
      setAvailability(availability.filter((s) => s !== value));
    } else if (availability.length < MAX_AVAILABILITY) {
      setAvailability([...availability, value]);
    }
  };

  const togglePet = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value === "none") {
      setPets(pets.includes("none") ? [] : ["none"]);
    } else {
      const without = pets.filter((p) => p !== "none");
      if (without.includes(value)) {
        setPets(without.filter((p) => p !== value));
      } else {
        setPets([...without, value]);
      }
    }
  };

  const toggleDietary = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value === "no_restrictions") {
      setDietary(dietary.includes("no_restrictions") ? [] : ["no_restrictions"]);
    } else {
      const without = dietary.filter((d) => d !== "no_restrictions");
      if (without.includes(value)) {
        setDietary(without.filter((d) => d !== value));
      } else {
        setDietary([...without, value]);
      }
    }
  };

  // ─── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!session?.user || !isDirty) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Promise.all([
      updateProfileFields(session.user.id, {
        personality_type: personalityType || null,
        communication_style: communicationStyle || null,
        kids: kids || null,
        relationship_status: relationshipStatus || null,
        work_style: workStyle || null,
      }),
      updateAvailability(session.user.id, availability),
      updatePets(session.user.id, pets),
      updateDietary(session.user.id, dietary),
    ]);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await refresh();
    setSaving(false);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
            <Text style={[styles.backText, { marginLeft: -2 }]}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More About You</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability */}
        <SectionLabel icon="🗓️" title="AVAILABILITY" counter={`${availability.length}/${MAX_AVAILABILITY}`} />
        <View style={styles.chipGrid}>
          {AVAILABILITY_SLOTS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={availability.includes(value)}
              disabled={!availability.includes(value) && availability.length >= MAX_AVAILABILITY}
              onPress={() => toggleAvailability(value)}
            />
          ))}
        </View>

        {/* Personality Type */}
        <SectionLabel icon="🧠" title="PERSONALITY TYPE" />
        <View style={styles.chipGrid}>
          {PERSONALITY_TYPES.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={personalityType === value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPersonalityType(personalityType === value ? "" : value);
              }}
            />
          ))}
        </View>

        {/* Communication Style */}
        <SectionLabel icon="💬" title="COMMUNICATION STYLE" />
        <View style={styles.chipGrid}>
          {COMMUNICATION_STYLES.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={communicationStyle === value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCommunicationStyle(communicationStyle === value ? "" : value);
              }}
            />
          ))}
        </View>

        {/* Kids */}
        <SectionLabel icon="👶" title="KIDS" />
        <View style={styles.chipGrid}>
          {KIDS_OPTIONS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={kids === value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setKids(kids === value ? "" : value);
              }}
            />
          ))}
        </View>

        {/* Pets */}
        <SectionLabel icon="🐾" title="PETS" />
        <View style={styles.chipGrid}>
          {PETS_OPTIONS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={pets.includes(value)}
              onPress={() => togglePet(value)}
            />
          ))}
        </View>

        {/* Relationship Status */}
        <SectionLabel icon="💕" title="RELATIONSHIP STATUS" />
        <View style={styles.chipGrid}>
          {RELATIONSHIP_STATUS_OPTIONS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={relationshipStatus === value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRelationshipStatus(relationshipStatus === value ? "" : value);
              }}
            />
          ))}
        </View>

        {/* Work Style */}
        <SectionLabel icon="💼" title="WORK STYLE" />
        <View style={styles.chipGrid}>
          {WORK_STYLE_OPTIONS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={workStyle === value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWorkStyle(workStyle === value ? "" : value);
              }}
            />
          ))}
        </View>

        {/* Dietary */}
        <SectionLabel icon="🍽️" title="DIETARY PREFERENCES" />
        <View style={styles.chipGrid}>
          {DIETARY_OPTIONS.map(({ label, value, icon }) => (
            <Chip
              key={value}
              label={label}
              icon={icon}
              selected={dietary.includes(value)}
              onPress={() => toggleDietary(value)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sticky save footer */}
      {isDirty && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Reusable sub-components ─────────────────────────────────

function SectionLabel({ icon, title, counter }: { icon: string; title: string; counter?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>
        {icon}  {title}
      </Text>
      {counter && <Text style={styles.sectionCounter}>{counter}</Text>}
    </View>
  );
}

function Chip({
  label,
  icon,
  selected,
  disabled,
  onPress,
}: {
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
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 18,
        backgroundColor: selected ? COLORS.primary : COLORS.surface,
        borderWidth: 1.5,
        borderColor: selected ? COLORS.primary : COLORS.border,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ fontSize: 14, marginRight: 5 }}>{icon}</Text>
      <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: selected ? "#FFF" : "#2D3436" }}>
        {label}
      </Text>
    </TouchableOpacity>
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
  backText: {
    fontSize: 17,
    fontFamily: fonts.body,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  sectionLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabelText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  sectionCounter: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: "#B2BEC3",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
