import { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

const SLOT_SIZE = 56;
const SLOT_GAP = 10;
const SLOT_TOTAL = SLOT_SIZE + SLOT_GAP;

type Props = {
  emojis: string[];
  onReorder: (emojis: string[]) => void;
  onRemove: (index: number) => void;
};

function DraggableSlot({
  emoji,
  index,
  onReorder,
  onRemove,
  totalCount,
}: {
  emoji: string;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  totalCount: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      scale.value = withSpring(1.15);
      zIndex.value = 100;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd(() => {
      const movedSlots = Math.round(translateX.value / SLOT_TOTAL);
      const targetIndex = Math.max(
        0,
        Math.min(totalCount - 1, index + movedSlots)
      );

      if (targetIndex !== index) {
        runOnJS(onReorder)(index, targetIndex);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 1;
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onRemove)(index);
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  });

  const gesture = Gesture.Exclusive(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.slot, animatedStyle]}>
        <Text style={styles.emojiText}>{emoji}</Text>
        <View style={styles.removeBadge}>
          <Text style={styles.removeX}>✕</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function DraggableEmojiSlots({
  emojis,
  onReorder,
  onRemove,
}: Props) {
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newEmojis = [...emojis];
      const [moved] = newEmojis.splice(fromIndex, 1);
      newEmojis.splice(toIndex, 0, moved);
      onReorder(newEmojis);
    },
    [emojis, onReorder]
  );

  return (
    <View style={styles.container}>
      <View style={styles.slotsRow}>
        {emojis.map((emoji, i) => (
          <DraggableSlot
            key={`${emoji}-${i}`}
            emoji={emoji}
            index={i}
            onReorder={handleReorder}
            onRemove={onRemove}
            totalCount={emojis.length}
          />
        ))}
        {Array.from({ length: Math.max(0, 5 - emojis.length) }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.emptySlot} />
        ))}
      </View>
      {emojis.length > 1 && (
        <Text style={styles.hint}>
          Most you → Least you
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  slotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SLOT_GAP,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emptySlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.disabled,
  },
  emojiText: {
    fontSize: 32,
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  removeX: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    lineHeight: 12,
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
