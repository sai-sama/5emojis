import { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

// ─── Base shimmer block ────────────────────────────────────
function SkeletonBlock({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        { backgroundColor: COLORS.border, borderRadius: 8 },
        style,
        animatedStyle,
      ]}
    />
  );
}

// ─── Swipe Card Skeleton ───────────────────────────────────
export function SwipeCardSkeleton() {
  return (
    <View style={skeletonStyles.swipeCard}>
      <SkeletonBlock style={{ width: "100%", height: "100%", borderRadius: 24 }} />
      {/* Overlay at bottom for text placeholders */}
      <View style={skeletonStyles.swipeCardOverlay}>
        <SkeletonBlock style={{ width: 140, height: 24, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: 100, height: 16, borderRadius: 6, marginTop: 8 }} />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Vibe Card Skeleton (horizontal scroll) ────────────────
export function VibeCardSkeleton() {
  return (
    <View style={skeletonStyles.vibeCard}>
      <SkeletonBlock style={{ width: "100%", height: 100, borderRadius: 12 }} />
      <SkeletonBlock style={{ width: 80, height: 14, borderRadius: 4, marginTop: 8 }} />
      <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} style={{ width: 20, height: 20, borderRadius: 10 }} />
        ))}
      </View>
    </View>
  );
}

// ─── Match Card Skeleton (list item) ───────────────────────
export function MatchCardSkeleton() {
  return (
    <View style={skeletonStyles.matchCard}>
      <SkeletonBlock style={{ width: "100%", height: 120, borderRadius: 14 }} />
      <View style={{ padding: 12 }}>
        <SkeletonBlock style={{ width: 120, height: 18, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: 80, height: 14, borderRadius: 4, marginTop: 6 }} />
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} style={{ width: 24, height: 24, borderRadius: 12 }} />
          ))}
        </View>
        <SkeletonBlock style={{ width: "70%", height: 14, borderRadius: 4, marginTop: 10 }} />
      </View>
    </View>
  );
}

// ─── Chat Message Skeleton ─────────────────────────────────
export function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <View style={[skeletonStyles.chatRow, isOwn && { justifyContent: "flex-end" }]}>
      {!isOwn && <SkeletonBlock style={{ width: 32, height: 32, borderRadius: 16 }} />}
      <SkeletonBlock
        style={{
          width: isOwn ? 180 : 200,
          height: 44,
          borderRadius: 16,
        }}
      />
    </View>
  );
}

// ─── Chat Skeleton (full screen) ──────────────────────────
export function ChatSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isOwn />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton />
      <ChatMessageSkeleton isOwn />
      <ChatMessageSkeleton />
    </View>
  );
}

// ─── Vibes Screen Skeleton ─────────────────────────────────
export function VibesScreenSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Vibes section */}
      <SkeletonBlock style={{ width: 120, height: 20, borderRadius: 6, marginBottom: 12 }} />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <VibeCardSkeleton key={i} />
        ))}
      </View>
      {/* Matches section */}
      <SkeletonBlock style={{ width: 100, height: 20, borderRadius: 6, marginBottom: 12 }} />
      {[1, 2].map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  swipeCard: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  swipeCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  vibeCard: {
    width: 130,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    padding: 8,
    marginRight: 4,
  },
  matchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
});
