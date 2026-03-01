import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";
import { Profile, ProfileEmoji, ProfilePhoto } from "../lib/types";
import Confetti from "./animations/Confetti";
import LottieCelebration from "./lottie/LottieCelebration";
import { playMatchSound } from "../lib/sounds";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type MatchModalProps = {
  visible: boolean;
  otherUser: Profile;
  otherEmojis: ProfileEmoji[];
  otherPhoto: ProfilePhoto | null;
  emojiMatchCount: number;
  isPerfect: boolean;
  userEmojis: string[];
  icebreakerQuestion: string | null;
  onClose: () => void;
  onSendEmojis: () => void;
};

// ─── Individual emoji that flies in ─────────────────────────
function FlyingEmoji({
  emoji,
  index,
  fromLeft,
  isMatch,
}: {
  emoji: string;
  index: number;
  fromLeft: boolean;
  isMatch: boolean;
}) {
  const translateX = useSharedValue(fromLeft ? -SCREEN_WIDTH : SCREEN_WIDTH);
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = 400 + index * 100;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateX.value = withDelay(
      delay,
      withSpring(0, { damping: 12, stiffness: 120, mass: 0.8 })
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.flyingEmojiWrap,
        isMatch && styles.flyingEmojiMatch,
        style,
      ]}
    >
      <Text style={styles.flyingEmojiText}>{emoji}</Text>
    </Animated.View>
  );
}

export default function MatchModal({
  visible,
  otherUser,
  otherEmojis,
  otherPhoto,
  emojiMatchCount,
  isPerfect,
  userEmojis,
  icebreakerQuestion,
  onClose,
  onSendEmojis,
}: MatchModalProps) {
  const userEmojiSet = useMemo(() => new Set(userEmojis), [userEmojis]);
  const hasTriggeredHaptics = useRef(false);

  useEffect(() => {
    if (visible && !hasTriggeredHaptics.current) {
      hasTriggeredHaptics.current = true;
      // Burst of haptics + sound for match celebration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playMatchSound();
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      if (isPerfect) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 400);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 700);
      }
    }
    if (!visible) {
      hasTriggeredHaptics.current = false;
    }
  }, [visible, isPerfect]);

  const sortedEmojis = [...otherEmojis].sort((a, b) => a.position - b.position);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Background blur-ish overlay */}
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.backdrop} />
        </Animated.View>

        {/* Confetti explosion (Reanimated particles) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Confetti />
        </View>

        {/* Lottie celebration overlay (stars + shapes) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LottieCelebration />
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.content}
        >
          {/* Header */}
          <Text style={styles.matchEmoji}>🤝</Text>
          <Text style={styles.title}>It's a Vibe!</Text>
          <Text style={styles.subtitle}>
            You and {otherUser.name} want to be friends
          </Text>

          {/* Photo */}
          {otherPhoto && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: otherPhoto.url }}
                style={styles.photo}
              />
              {isPerfect && (
                <View style={styles.perfectBadge}>
                  <Text style={styles.perfectBadgeText}>5/5 ✨</Text>
                </View>
              )}
            </View>
          )}

          {/* Name + emoji count */}
          <Text style={styles.name}>
            {otherUser.name}
          </Text>
          {emojiMatchCount > 0 && (
            <View style={styles.matchCountBadge}>
              <Text style={styles.matchCountText}>
                {isPerfect
                  ? "Perfect emoji match!"
                  : `${emojiMatchCount} emoji${emojiMatchCount > 1 ? "s" : ""} in common`}
              </Text>
            </View>
          )}

          {/* Flying emojis */}
          <View style={styles.emojiRow}>
            {sortedEmojis.map((e, i) => (
              <FlyingEmoji
                key={e.id}
                emoji={e.emoji}
                index={i}
                fromLeft={i % 2 === 0}
                isMatch={userEmojiSet.has(e.emoji)}
              />
            ))}
          </View>

          {/* Icebreaker preview */}
          {icebreakerQuestion && (
            <Animated.View
              entering={FadeIn.delay(800).duration(400)}
              style={styles.icebreakerPreview}
            >
              <Text style={styles.icebreakerLabel}>Your first challenge:</Text>
              <Text style={styles.icebreakerText}>
                5 Emojis I would use to describe... {icebreakerQuestion}?
              </Text>
            </Animated.View>
          )}

          {/* Actions */}
          <Animated.View
            entering={FadeIn.delay(900).duration(400)}
            style={styles.actions}
          >
            <Pressable style={styles.primaryButton} onPress={onSendEmojis}>
              <Text style={styles.primaryButtonText}>
                {icebreakerQuestion ? "Answer the Icebreaker ❓" : "Send 5 Emojis 💬"}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
    width: "100%",
  },
  matchEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.heading,
    color: "#FFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 24,
    textAlign: "center",
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.highlight,
    marginBottom: 12,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  perfectBadge: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    backgroundColor: COLORS.highlight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  perfectBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: "#FFF",
    marginBottom: 6,
  },
  matchCountBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  matchCountText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.highlight,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  flyingEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  flyingEmojiMatch: {
    backgroundColor: "rgba(251, 191, 36, 0.25)",
    borderColor: COLORS.highlight,
    shadowColor: COLORS.highlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  flyingEmojiText: {
    fontSize: 28,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: "#FFF",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.7)",
  },
  icebreakerPreview: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  icebreakerLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  icebreakerText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
    lineHeight: 22,
  },
});
