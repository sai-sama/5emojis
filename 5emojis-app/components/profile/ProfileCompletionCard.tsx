import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import { getProfileCompletion, type CompletionField } from "../../lib/profile-completion";
import { FullProfile } from "../../lib/profile-service";

type Props = {
  profile: FullProfile;
};

export default function ProfileCompletionCard({ profile }: Props) {
  const { percentage, filled, total, missing } = getProfileCompletion(profile);

  if (percentage >= 100) return null;

  const nextMissing: CompletionField | undefined = missing[0];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (nextMissing) router.push(nextMissing.route as any);
      }}
    >
      <View style={styles.top}>
        <View style={styles.textCol}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            {filled} of {total} filled — better profiles get more matches!
          </Text>
        </View>
        <View style={styles.percentCircle}>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>

      {/* Next suggestion */}
      {nextMissing && (
        <View style={styles.suggestion}>
          <Text style={styles.suggestionText}>
            Next: Add your {nextMissing.label.toLowerCase()}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  percentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  percentText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: COLORS.primary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primarySoft,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "300",
  },
});
