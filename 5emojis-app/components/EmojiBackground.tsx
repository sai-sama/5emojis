import { View, Text, StyleSheet, Dimensions } from "react-native";
import { memo, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// Default: a curated set of emojis that feel fun and friendly
const DEFAULT_EMOJIS = [
  "😊", "🎉", "💜", "🌟", "🤝", "🎨", "🌈", "✨", "🎭", "🌸",
  "🦋", "🎵", "🍕", "☕", "🏄", "🎯", "🌍", "💡", "🎪", "🧩",
  "🚀", "🌻", "🎸", "📚", "🏠", "🐶", "🌊", "🎬", "🧘", "🍦",
  "💃", "🎤", "🌮", "🏔️", "🎲", "🧁", "🎹", "🌺", "🐱", "🏖️",
  "🎳", "🍜", "🎻", "🌙", "🦄", "🎪", "🍿", "🏀", "🎧", "🌴",
];

// Photo-centric emojis for the photos screen
export const PHOTO_EMOJIS = [
  "📸", "🤳", "📷", "🖼️", "🎞️", "💫", "✨", "🌟", "😎", "🤩",
  "💅", "🪞", "🎨", "🌅", "🌇", "🏞️", "🎭", "💐", "🌺", "🦋",
  "👗", "💄", "🕶️", "🎀", "💎", "🪄", "📱", "🫧", "🌈", "💜",
];

const EMOJI_SIZE = 14;
const GAP = 24;

type Props = {
  emojis?: string[];
  opacity?: number;
};

function EmojiBackground({ emojis = DEFAULT_EMOJIS, opacity = 0.13 }: Props) {
  const cols = Math.floor(width / GAP);
  // Extra rows so the drift loops seamlessly
  const rows = Math.ceil(height / GAP) + 3;

  // Center the grid horizontally
  const totalGridWidth = cols * GAP;
  const xStart = (width - totalGridWidth) / 2 + (GAP - EMOJI_SIZE) / 2;

  // Gentle upward drift — shift by exactly one GAP then reset (seamless loop)
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-GAP, { duration: 4000, easing: Easing.linear }),
      -1, // infinite
      false // don't reverse — snap back to 0 and drift again
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const grid = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) % emojis.length;
      grid.push(
        <Text
          key={`${row}-${col}`}
          style={[
            styles.emoji,
            {
              left: xStart + col * GAP,
              top: row * GAP,
              opacity,
            },
          ]}
        >
          {emojis[idx]}
        </Text>
      );
    }
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.inner, animatedStyle]}>
        {grid}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: -GAP * 3, // extra space for the overflow rows
  },
  emoji: {
    position: "absolute",
    fontSize: EMOJI_SIZE,
    textAlign: "center",
    width: EMOJI_SIZE,
  },
});

export default memo(EmojiBackground);
