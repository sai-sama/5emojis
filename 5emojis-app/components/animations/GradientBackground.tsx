import { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: W, height: H } = Dimensions.get("window");

type GradientBackgroundProps = {
  /**
   * "warm" — peachy warm tones (default, for main screens)
   * "cool" — cool purple/blue tones (for match modal)
   * "aurora" — shifting aurora borealis (for special moments)
   */
  variant?: "warm" | "cool" | "aurora";
};

const GRADIENTS = {
  warm: {
    colors: ["#FFF8F0", "#FFF0E6", "#F5EEFF", "#FFF8F0"] as const,
    duration: 8000,
  },
  cool: {
    colors: ["#1a0533", "#2d1b69", "#1e1145", "#1a0533"] as const,
    duration: 6000,
  },
  aurora: {
    colors: ["#FFF8F0", "#E8F0FF", "#F0E8FF", "#FFF0F8"] as const,
    duration: 10000,
  },
};

export default function GradientBackground({
  variant = "warm",
}: GradientBackgroundProps) {
  const progress = useSharedValue(0);
  const config = GRADIENTS[variant];

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = 0.3 + progress.value * 0.15;
    return { opacity };
  });

  // Use static gradient colors — the animation is just a subtle opacity pulse
  // This avoids the complexity of animating gradient stops while still
  // giving life to the background
  const gradientColors: readonly [string, string, ...string[]] =
    variant === "cool"
      ? ["#1a0533", "#2d1b69", "#1e1145"]
      : variant === "aurora"
        ? ["#FFF8F0", "#E8F0FF", "#F5EEFF"]
        : ["#FFF8F0", "#FFF0E6", "#F5EEFF"];

  return (
    <>
      {/* Base solid color */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: variant === "cool" ? "#1a0533" : "#FFF8F0",
          },
        ]}
      />
      {/* Animated gradient overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Secondary gradient for depth (cross-direction) */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}>
        <LinearGradient
          colors={
            variant === "cool"
              ? ["transparent", "rgba(124, 58, 237, 0.15)", "transparent"]
              : ["transparent", "rgba(124, 58, 237, 0.04)", "transparent"]
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}
