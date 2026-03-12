import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../../lib/fonts";
import { COLORS, GENDERS, FREE_MAX_RADIUS_MILES, type GenderValue } from "../../lib/constants";
import { RADIUS_STEPS } from "../../lib/profile-constants";
import { usePremium } from "../../lib/premium-context";

const AGE_PRESETS = [
  { label: "Any", min: 18, max: 99 },
  { label: "18-25", min: 18, max: 25 },
  { label: "25-35", min: 25, max: 35 },
  { label: "35-50", min: 35, max: 50 },
  { label: "50+", min: 50, max: 99 },
] as const;

// Free users only see preset age ranges; custom age range is premium
const FREE_AGE_PRESETS = AGE_PRESETS;

type Props = {
  genderFilters: GenderValue[];
  onGenderToggle: (value: GenderValue) => void;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  preferredAgeMin: number;
  preferredAgeMax: number;
  onAgeChange: (min: number, max: number) => void;
};

export default function DiscoveryFiltersRibbon({
  genderFilters,
  onGenderToggle,
  searchRadius,
  onRadiusChange,
  preferredAgeMin,
  preferredAgeMax,
  onAgeChange,
}: Props) {
  const { canAccessPremium } = usePremium();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  // ─── Summary line ──────────────────────────────────────────
  const genderSummary =
    genderFilters.length === GENDERS.length
      ? "Everyone"
      : genderFilters
          .map((v) => GENDERS.find((g) => g.value === v)?.label ?? v)
          .join(", ");

  const ageSummary =
    preferredAgeMin <= 18 && preferredAgeMax >= 99
      ? "Any age"
      : `${preferredAgeMin}-${preferredAgeMax >= 99 ? "99+" : preferredAgeMax}`;

  const summary = `${genderSummary}  ·  ${searchRadius}mi  ·  ${ageSummary}`;

  // ─── Active age preset ─────────────────────────────────────
  const activeAgePreset = AGE_PRESETS.find(
    (p) => p.min === preferredAgeMin && p.max === preferredAgeMax
  );

  return (
    <View style={styles.container}>
      {/* Header / collapsed ribbon */}
      <Pressable style={styles.header} onPress={toggle}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.primary}
          style={{ marginRight: 8 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Discovery Filters</Text>
          {!expanded && (
            <Text style={styles.summary} numberOfLines={1}>
              {summary}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.textSecondary}
        />
      </Pressable>

      {/* Expanded body */}
      {expanded && (
        <View style={styles.body}>
          {/* Gender */}
          <Text style={styles.label}>SHOW ME</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const isChecked = genderFilters.includes(g.value);
              return (
                <Pressable
                  key={g.value}
                  onPress={() => onGenderToggle(g.value)}
                  style={styles.genderItem}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && {
                        backgroundColor: g.color,
                        borderColor: g.color,
                      },
                    ]}
                  >
                    {isChecked && (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    )}
                  </View>
                  <Text style={styles.genderEmoji}>{g.emoji}</Text>
                  <Text style={styles.genderLabel}>{g.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Distance */}
          <Text style={styles.label}>DISTANCE</Text>
          <View style={styles.chipRow}>
            {RADIUS_STEPS.map((r) => {
              const active = searchRadius === r;
              const locked = !canAccessPremium && r > FREE_MAX_RADIUS_MILES;
              return (
                <Pressable
                  key={r}
                  onPress={() => {
                    if (locked) {
                      router.push("/premium");
                      return;
                    }
                    Haptics.selectionAsync();
                    onRadiusChange(r);
                  }}
                  style={[styles.chip, active && styles.chipActive, locked && styles.chipLocked]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                      locked && styles.chipTextLocked,
                    ]}
                  >
                    {r}mi{locked ? " \uD83D\uDD12" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Age Range */}
          <Text style={styles.label}>AGE RANGE</Text>
          <View style={styles.chipRow}>
            {AGE_PRESETS.map((preset) => {
              const active =
                preset.min === preferredAgeMin &&
                preset.max === preferredAgeMax;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onAgeChange(preset.min, preset.max);
                  }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={COLORS.textMuted}
            />
            <Text style={styles.disclaimer}>
              Filters apply when the other person has filled out the relevant
              info on their profile.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  summary: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Expanded body
  body: {
    marginTop: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  genderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  genderEmoji: {
    fontSize: 14,
  },
  genderLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.text,
  },

  // Chips (radius + age)
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: "#FFF",
  },
  chipLocked: {
    opacity: 0.5,
    borderStyle: "dashed",
  },
  chipTextLocked: {
    color: COLORS.textMuted,
  },

  // Disclaimer
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 4,
  },
  disclaimer: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    fontStyle: "italic",
    lineHeight: 16,
  },
});
