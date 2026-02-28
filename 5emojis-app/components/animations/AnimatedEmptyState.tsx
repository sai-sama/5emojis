import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

type AnimatedEmptyStateProps = {
  emoji: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export default function AnimatedEmptyState({
  emoji,
  title,
  subtitle,
  children,
}: AnimatedEmptyStateProps) {
  // Floating animation for the main emoji
  const floatY = useSharedValue(0);
  const floatRotate = useSharedValue(0);
  const scale = useSharedValue(0);

  // Sparkle emojis that orbit around
  const sparkle1Y = useSharedValue(0);
  const sparkle1X = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Y = useSharedValue(0);
  const sparkle2X = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);

  useEffect(() => {
    // Main emoji entrance + float
    scale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(3)) }),
      withTiming(1, { duration: 200 })
    );

    floatY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(12, { duration: 2000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    floatRotate.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
          withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    // Sparkle 1 — gentle orbit
    sparkle1Opacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    sparkle1Y.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
          withTiming(20, { duration: 2500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    sparkle1X.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
          withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    // Sparkle 2 — offset orbit
    sparkle2Opacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    sparkle2Y.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(18, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
          withTiming(-18, { duration: 2800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    sparkle2X.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(12, { duration: 2200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${floatRotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1Opacity.value,
    transform: [
      { translateX: sparkle1X.value },
      { translateY: sparkle1Y.value },
    ],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2Opacity.value,
    transform: [
      { translateX: sparkle2X.value },
      { translateY: sparkle2Y.value },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Floating emoji with sparkles */}
      <View style={styles.emojiContainer}>
        <Animated.Text style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
          ✨
        </Animated.Text>
        <Animated.Text style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
          💫
        </Animated.Text>
        <Animated.Text style={[styles.mainEmoji, emojiStyle]}>
          {emoji}
        </Animated.Text>
      </View>

      {/* Text — fades in */}
      <Animated.Text entering={FadeIn.delay(400).duration(500)} style={styles.title}>
        {title}
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(600).duration(500)} style={styles.subtitle}>
        {subtitle}
      </Animated.Text>

      {/* Optional children (e.g. a button) */}
      {children && (
        <Animated.View entering={FadeIn.delay(800).duration(500)}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  mainEmoji: {
    fontSize: 56,
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
  },
  sparkle1: {
    top: -5,
    right: -5,
  },
  sparkle2: {
    bottom: 0,
    left: -8,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
