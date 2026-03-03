import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS, MIN_FRIEND_AGE, MAX_FRIEND_AGE } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function AgePrefScreen() {
  const { data, update } = useOnboarding();
  const [minAge, setMinAge] = useState(data.preferredAgeMin);
  const [maxAge, setMaxAge] = useState(data.preferredAgeMax);
  // Raw text for typing — allows partial input without clamping mid-keystroke
  const [minText, setMinText] = useState(String(data.preferredAgeMin));
  const [maxText, setMaxText] = useState(String(data.preferredAgeMax));

  const adjustMin = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(MIN_FRIEND_AGE, Math.min(maxAge, minAge + delta));
    setMinAge(next);
    setMinText(String(next));
  };

  const adjustMax = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(minAge, Math.min(MAX_FRIEND_AGE, maxAge + delta));
    setMaxAge(next);
    setMaxText(String(next));
  };

  const handleMinChange = (text: string) => {
    // Allow free typing — only digits
    const cleaned = text.replace(/[^0-9]/g, "");
    setMinText(cleaned);
  };

  const handleMinBlur = () => {
    const num = parseInt(minText, 10);
    if (isNaN(num) || minText === "") {
      setMinText(String(minAge));
      return;
    }
    const clamped = Math.max(MIN_FRIEND_AGE, Math.min(maxAge, num));
    setMinAge(clamped);
    setMinText(String(clamped));
  };

  const handleMaxChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setMaxText(cleaned);
  };

  const handleMaxBlur = () => {
    const num = parseInt(maxText, 10);
    if (isNaN(num) || maxText === "") {
      setMaxText(String(maxAge));
      return;
    }
    const clamped = Math.max(minAge, Math.min(MAX_FRIEND_AGE, num));
    setMaxAge(clamped);
    setMaxText(String(clamped));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          Friend age range
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 40 }}
        >
          What ages are you open to hanging out with?
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {/* Large tappable age range display */}
          <View style={styles.rangeDisplay}>
            <TextInput
              style={styles.rangeInput}
              value={minText}
              onChangeText={handleMinChange}
              onBlur={handleMinBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
            <Text style={styles.rangeDash}>—</Text>
            <TextInput
              style={styles.rangeInput}
              value={maxText}
              onChangeText={handleMaxChange}
              onBlur={handleMaxBlur}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
          </View>

          <Text style={styles.hintText}>Tap the numbers to type, or use +/− buttons</Text>

          {/* Min age stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Min Age</Text>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={() => adjustMin(-1)}
                disabled={minAge <= MIN_FRIEND_AGE}
                style={[styles.stepperButton, minAge <= MIN_FRIEND_AGE && styles.stepperDisabled]}
              >
                <Text style={[styles.stepperButtonText, minAge <= MIN_FRIEND_AGE && styles.stepperButtonTextDisabled]}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{minAge}</Text>
              <TouchableOpacity
                onPress={() => adjustMin(1)}
                disabled={minAge >= maxAge}
                style={[styles.stepperButton, minAge >= maxAge && styles.stepperDisabled]}
              >
                <Text style={[styles.stepperButtonText, minAge >= maxAge && styles.stepperButtonTextDisabled]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Max age stepper */}
          <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>Max Age</Text>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                onPress={() => adjustMax(-1)}
                disabled={maxAge <= minAge}
                style={[styles.stepperButton, maxAge <= minAge && styles.stepperDisabled]}
              >
                <Text style={[styles.stepperButtonText, maxAge <= minAge && styles.stepperButtonTextDisabled]}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{maxAge}</Text>
              <TouchableOpacity
                onPress={() => adjustMax(1)}
                disabled={maxAge >= MAX_FRIEND_AGE}
                style={[styles.stepperButton, maxAge >= MAX_FRIEND_AGE && styles.stepperDisabled]}
              >
                <Text style={[styles.stepperButtonText, maxAge >= MAX_FRIEND_AGE && styles.stepperButtonTextDisabled]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <OnboardingButton
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ preferredAgeMin: minAge, preferredAgeMax: maxAge });
            router.push("/(onboarding)/location");
          }}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rangeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  rangeInput: {
    fontSize: 48,
    fontFamily: fonts.heading,
    color: COLORS.primary,
    textAlign: "center",
    minWidth: 80,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rangeDash: {
    fontSize: 36,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginHorizontal: 12,
  },
  hintText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  stepperLabel: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  stepperButtonText: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: COLORS.primary,
    marginTop: -1,
  },
  stepperButtonTextDisabled: {
    color: COLORS.disabled,
  },
  stepperValue: {
    fontSize: 20,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
    minWidth: 36,
    textAlign: "center",
  },
});
