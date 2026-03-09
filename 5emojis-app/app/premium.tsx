import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { usePremium } from "../lib/premium-context";
import { SUBSCRIPTION_PRICES, COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

const FEATURES = [
  { icon: "infinite-outline", label: "Unlimited right swipes" },
  { icon: "happy-outline", label: "Unlimited emoji edits" },
  { icon: "arrow-undo-outline", label: "Undo accidental passes" },
  { icon: "star-outline", label: "3 super likes per day" },
  { icon: "eye-outline", label: "See who liked you" },
  { icon: "options-outline", label: "Full filter access (100+ mi, custom age)" },
  { icon: "lock-open-outline", label: "Add hidden reveals to your profile" },
] as const;

type PlanKey = "monthly" | "annual";

const PLANS: { key: PlanKey; label: string; price: string; perWeek: string; badge?: string }[] = [
  { key: "annual", label: "Annual", price: SUBSCRIPTION_PRICES.annual, perWeek: "$0.96/wk", badge: "Best Value" },
  { key: "monthly", label: "Monthly", price: SUBSCRIPTION_PRICES.monthly, perWeek: "$1.85/wk" },
];

export default function PremiumScreen() {
  const { isPremium, packages, purchase, restore, loading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("annual");
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    // Find the matching package from RevenueCat
    const planMap: Record<PlanKey, string> = {
      monthly: "$rc_monthly",
      annual: "$rc_annual",
    };

    const pkg = packages.find((p) =>
      p.identifier === planMap[selectedPlan] ||
      p.product.identifier.includes(selectedPlan)
    );

    if (!pkg) {
      Alert.alert("Not Available", "This plan is not available yet. Please try again later.");
      return;
    }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await purchase(pkg);
    setPurchasing(false);

    if (error) {
      Alert.alert("Purchase Failed", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const { error } = await restore();
    setRestoring(false);

    if (error) {
      Alert.alert("Restore", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Restored!", "Your premium subscription has been restored.");
      router.back();
    }
  };

  // If already premium, show a confirmation
  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        </View>
        <View style={styles.alreadyPremium}>
          <Text style={styles.starBig}>*</Text>
          <Text style={styles.alreadyTitle}>You're Premium!</Text>
          <Text style={styles.alreadySubtitle}>
            You have access to all premium features.
          </Text>
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Close button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.starCircle}>
            <Ionicons name="star" size={32} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>5Emojis Premium</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the full experience and find friends faster
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <Text style={styles.planHeader}>Choose your plan</Text>
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.key;
            return (
              <Pressable
                key={plan.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedPlan(plan.key);
                }}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                  {plan.price}
                </Text>
                <Text style={[styles.planPerWeek, isSelected && styles.planPerWeekSelected]}>
                  {plan.perWeek}
                </Text>
                <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                  {isSelected && <View style={styles.planRadioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Subscribe button */}
        <Pressable
          style={[styles.subscribeButton, purchasing && { opacity: 0.7 }]}
          onPress={handlePurchase}
          disabled={purchasing || loading}
        >
          {purchasing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.subscribeText}>
              Subscribe for {SUBSCRIPTION_PRICES[selectedPlan]}
              {selectedPlan === "monthly" ? "/mo" : "/yr"}
            </Text>
          )}
        </Pressable>

        {/* Restore */}
        <Pressable
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.restoreText}>Restore Purchase</Text>
          )}
        </Pressable>

        {/* Legal fine print */}
        <Text style={styles.finePrint}>
          Payment will be charged to your Apple ID or Google Play account at
          confirmation of purchase. Subscription automatically renews unless
          auto-renew is turned off at least 24 hours before the end of the
          current period. You can manage or cancel subscriptions in your device
          settings.
        </Text>
      </ScrollView>
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
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  starCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Features
  featuresCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3EFFE",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },

  // Plan selector
  planHeader: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#8B5CF6",
    backgroundColor: "#FAFAFF",
  },
  planBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
  planLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  planLabelSelected: {
    color: "#8B5CF6",
  },
  planPrice: {
    fontSize: 20,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginTop: 4,
  },
  planPriceSelected: {
    color: "#8B5CF6",
  },
  planPerWeek: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  planPerWeekSelected: {
    color: "#8B5CF6",
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioSelected: {
    borderColor: "#8B5CF6",
  },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8B5CF6",
  },

  // Subscribe
  subscribeButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: fonts.bodySemiBold,
  },

  // Restore
  restoreButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },

  // Fine print
  finePrint: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },

  // Already premium
  alreadyPremium: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  starBig: {
    fontSize: 48,
    marginBottom: 16,
  },
  alreadyTitle: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 8,
  },
  alreadySubtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
