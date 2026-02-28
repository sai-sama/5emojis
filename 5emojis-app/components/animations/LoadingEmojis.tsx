import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

const EMOJIS = ["👋", "🎉", "🌟", "💜", "🤝"];
const DOT_SIZE = 48;

function BouncingEmoji({ emoji, index }: { emoji: string; index: number }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    const delay = index * 120;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) })
        ),
        -1, // infinite
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0.85, { duration: 350, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.dot, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

type LoadingEmojisProps = {
  message?: string;
};

export default function LoadingEmojis({ message = "Loading..." }: LoadingEmojisProps) {
  return (
    <View style={styles.container}>
      <View style={styles.emojiRow}>
        {EMOJIS.map((emoji, i) => (
          <BouncingEmoji key={i} emoji={emoji} index={i} />
        ))}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emojiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 14,
    backgroundColor: "#F5F0FF",
    borderWidth: 1.5,
    borderColor: "#E4DAFF",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
});
