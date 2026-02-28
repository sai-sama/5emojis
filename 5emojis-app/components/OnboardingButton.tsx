import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function OnboardingButton({
  label = "Continue",
  onPress,
  disabled = false,
  loading = false,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isActive = !disabled && !loading;

  return (
    <Animated.View entering={FadeIn.duration(400).delay(500)} style={animatedStyle}>
      <TouchableOpacity
        disabled={!isActive}
        activeOpacity={0.9}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[styles.wrapper, isActive && styles.wrapperActive]}
      >
        <LinearGradient
          colors={isActive ? [COLORS.primary, COLORS.primaryLight] : [COLORS.disabled, COLORS.disabled]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  wrapperActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  label: {
    color: "#FFF",
    fontSize: 17,
    fontFamily: fonts.bodySemiBold,
  },
});
