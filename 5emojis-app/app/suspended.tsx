import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AuroraBackground from "../components/skia/AuroraBackground";
import { useAuth } from "../lib/auth-context";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

export default function SuspendedScreen() {
  const { suspendedUntil, signOut } = useAuth();

  const formattedDate = suspendedUntil
    ? new Date(suspendedUntil).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AuroraBackground variant="warm" />
      <SafeAreaView style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="pause-circle-outline" size={72} color={COLORS.accent} />
        </View>

        <Text style={styles.title}>Account Suspended</Text>

        <Text style={styles.body}>
          Your account has been temporarily suspended due to multiple reports from other users.
        </Text>

        {formattedDate && (
          <View style={styles.dateCard}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <View>
              <Text style={styles.dateLabel}>Suspension ends</Text>
              <Text style={styles.dateValue}>{formattedDate}</Text>
            </View>
          </View>
        )}

        <View style={styles.appealCard}>
          <Text style={styles.appealTitle}>Think this is a mistake?</Text>
          <Text style={styles.appealBody}>
            You can appeal this suspension by emailing us. Include your account email and we'll review your case.
          </Text>
          <Text style={styles.appealEmail}>info@saibuilds.com</Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
  dateValue: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
    marginTop: 2,
  },
  appealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  appealTitle: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 8,
  },
  appealBody: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  appealEmail: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
