import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { useState } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  onDismiss: () => void;
};

const STEPS = [
  {
    icon: "arrow-back" as const,
    iconColor: COLORS.pass,
    title: "Swipe left to pass",
    subtitle: "Not your vibe? No worries — swipe left to skip.",
  },
  {
    icon: "arrow-forward" as const,
    iconColor: COLORS.vibe,
    title: "Swipe right to vibe",
    subtitle: "Want to be friends? Swipe right to send a vibe!",
  },
];

export default function SwipeTutorial({ onDismiss }: Props) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onDismiss();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
      pointerEvents="box-none"
    >
      <Pressable style={styles.backdrop} onPress={handleNext}>
        <View style={styles.content}>
          {/* Step indicator dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Animated icon */}
          <Animated.View
            key={step}
            entering={FadeIn.duration(250)}
            style={styles.iconContainer}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: current.iconColor + "20" },
              ]}
            >
              <Ionicons
                name={current.icon}
                size={48}
                color={current.iconColor}
              />
            </View>
          </Animated.View>

          {/* Text */}
          <Animated.View key={`text-${step}`} entering={FadeIn.duration(250)}>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.subtitle}>{current.subtitle}</Text>
          </Animated.View>

          {/* Button */}
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {isLastStep ? "Got it!" : "Next"}
            </Text>
          </Pressable>

          {/* Skip link */}
          {!isLastStep && (
            <Pressable onPress={onDismiss} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip tutorial</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  dotInactive: {
    backgroundColor: COLORS.border,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: fonts.bodySemiBold,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },
});
