import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Animated as RNAnimated,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { COLORS, PREMIUM_GATES } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { SwipeCard } from "./SwipeCard";
import { EmojiSizzle } from "./EmojiSizzle";
import MatchModal from "../MatchModal";
import { useAuth } from "../../lib/auth-context";
import { recordSwipe, undoSwipe, type MatchResult } from "../../lib/swipe-service";
import {
  fetchDiscoveryFeed,
  fetchOwnProfile,
  type DiscoveryProfile,
} from "../../lib/discovery-service";
import { supabase } from "../../lib/supabase";
import { Profile, ProfileEmoji, ProfilePhoto } from "../../lib/types";
import {
  MOCK_PROFILES,
  MOCK_USER_LAT,
  MOCK_USER_LNG,
  MOCK_USER_EMOJIS,
  MOCK_PRE_SWIPED_IDS,
  type SwipeProfile,
} from "./mockProfiles";
import LottieEmptyState from "../lottie/LottieEmptyState";
import { playSwipeSound } from "../../lib/sounds";
import type { GenderValue } from "../../lib/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Geometry ───────────────────────────────────────────────
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

// ─── Thresholds ─────────────────────────────────────────────
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const VELOCITY_THRESHOLD = 600;
const MAX_ROTATION_DEG = 10;

// ─── Exit ───────────────────────────────────────────────────
const EXIT_X = SCREEN_WIDTH * 1.5;
const EXIT_DURATION = 280;

// ─── Stack ──────────────────────────────────────────────────
const MAX_VISIBLE = 3;

// ─── Spring configs ─────────────────────────────────────────
const SPRING_BACK = {
  damping: 22,
  stiffness: 220,
  mass: 0.7,
  overshootClamping: false,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
};


// ─── Emoji sets for swipe feedback ──────────────────────────
const VIBE_EMOJIS = ["🎉", "✨", "💛", "🤝", "🔥"];
const PASS_EMOJIS = ["💨", "👋", "😅", "🫠", "💭"];

// ─── Themed emoji pairs for action buttons ──────────────────
// Each theme has a [vibe, pass] pair — rotates per card
// ─── Mock icebreaker questions for local testing ─────────
const MOCK_ICEBREAKERS = [
  "my perfect weekend",
  "my morning routine",
  "my cooking skills",
  "what my fridge contains right now",
  "my relationship with my alarm clock",
  "my dream vacation",
  "my go-to comfort food",
  "what I'm like at a party",
  "my hidden talent",
  "my Netflix queue",
  "my ideal road trip",
  "my coffee addiction level",
  "my relationship with exercise",
  "what my phone wallpaper says about me",
  "my guilty pleasure playlist",
  "what happens when I'm hungry",
  "my pet peeve",
  "my dream dinner guest list",
  "my superpower if I had one",
  "what I'm like before my first coffee",
];
let _mockIcebreakerIdx = 0;
function getNextMockIcebreaker(): string {
  const q = MOCK_ICEBREAKERS[_mockIcebreakerIdx % MOCK_ICEBREAKERS.length];
  _mockIcebreakerIdx++;
  return q;
}

const EMOJI_THEMES: [string, string][] = [
  ["🤝", "👋"], // handshake vs wave
  ["🔥", "💨"], // fire vs wind
  ["🎉", "😴"], // party vs sleepy
  ["💜", "👻"], // love vs ghost
  ["🚀", "🐌"], // rocket vs snail
  ["🌟", "🌧️"], // star vs rain
  ["🍕", "🥦"], // pizza vs broccoli
  ["🎵", "🔇"], // music vs mute
  ["☀️", "🌙"], // sun vs moon
  ["🦋", "🪨"], // butterfly vs rock
  ["💃", "🧊"], // dance vs ice
  ["🎯", "🎪"], // bullseye vs circus
];

// ═════════════════════════════════════════════════════════════
// Per-card top card component
// Each instance owns its own translateX/translateY.
// When swiped off, translateX stays at EXIT_X — never reset.
// React unmounts this component when currentIndex advances.
// ═════════════════════════════════════════════════════════════

type SwipeableTopCardHandle = {
  triggerSwipe: (direction: "left" | "right") => void;
};

const SwipeableTopCard = forwardRef<
  SwipeableTopCardHandle,
  {
    profile: SwipeProfile;
    dragProgress: SharedValue<number>;
    onSwipeComplete: (direction: "left" | "right") => void;
    userLat: number;
    userLng: number;
    userEmojis: string[];
  }
>(function SwipeableTopCard({ profile, dragProgress, onSwipeComplete, userLat, userLng, userEmojis }, ref) {
  // ─── Per-card shared values (never shared, never reset) ───
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureContext = useSharedValue({ x: 0, y: 0 });
  const hasHitThreshold = useSharedValue(false);


  // ─── Haptic helpers (called via runOnJS from worklets) ──────
  const hapticThreshold = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const hapticUncross = () => Haptics.selectionAsync();
  const hapticSwipeRight = () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const hapticSwipeLeft = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  const hapticSnapBack = () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // ─── Expose triggerSwipe for button presses (JS thread) ────
  useImperativeHandle(ref, () => ({
    triggerSwipe(direction: "left" | "right") {
      if (direction === "right") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      const targetX = direction === "right" ? EXIT_X : -EXIT_X;
      // Animate behind cards to match top card position during exit
      // so the transition is seamless when the new card takes over.
      dragProgress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      translateX.value = withTiming(
        targetX,
        { duration: 300, easing: Easing.out(Easing.cubic) },
        () => runOnJS(onSwipeComplete)(direction)
      );
      translateY.value = withTiming(-30, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    },
  }));

  // ─── Pan gesture (all callbacks are worklets) ─────────────
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Reset dragProgress from previous swipe — safe here because
      // the user's finger is on the card, fully covering behind cards.
      dragProgress.value = 0;
      gestureContext.value = {
        x: translateX.value,
        y: translateY.value,
      };
    })
    .onUpdate((event) => {
      translateX.value = gestureContext.value.x + event.translationX;
      translateY.value = gestureContext.value.y + event.translationY * 0.5;

      // Update drag progress (drives behind-card breathing)
      dragProgress.value = interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP
      );

      const pastThreshold = Math.abs(translateX.value) > SWIPE_THRESHOLD;
      if (pastThreshold && !hasHitThreshold.value) {
        hasHitThreshold.value = true;
        runOnJS(hapticThreshold)();
      } else if (!pastThreshold && hasHitThreshold.value) {
        hasHitThreshold.value = false;
        runOnJS(hapticUncross)();
      }
    })
    .onEnd((event) => {
      const dragX = translateX.value;
      const velX = event.velocityX;
      const velY = event.velocityY;

      const shouldSwipeRight =
        dragX > SWIPE_THRESHOLD || velX > VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        dragX < -SWIPE_THRESHOLD || velX < -VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        runOnJS(hapticSwipeRight)();
        // DON'T reset dragProgress during exit — behind card stays at scale 1.0
        // so the new top card matches perfectly (no bump). Parent resets after swap.
        translateX.value = withTiming(
          EXIT_X,
          { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) },
          () => runOnJS(onSwipeComplete)("right")
        );
        translateY.value = withTiming(
          translateY.value + velY * 0.15,
          { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) }
        );
      } else if (shouldSwipeLeft) {
        runOnJS(hapticSwipeLeft)();
        translateX.value = withTiming(
          -EXIT_X,
          { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) },
          () => runOnJS(onSwipeComplete)("left")
        );
        translateY.value = withTiming(
          translateY.value + velY * 0.15,
          { duration: EXIT_DURATION, easing: Easing.out(Easing.cubic) }
        );
      } else {
        // Snap back
        runOnJS(hapticSnapBack)();
        translateX.value = withSpring(0, SPRING_BACK);
        translateY.value = withSpring(0, SPRING_BACK);
        dragProgress.value = withSpring(0, SPRING_BACK);
      }
    })
    .activeOffsetX([-10, 10]);

  // ─── Top card animated style ──────────────────────────────
  const topCardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION_DEG, 0, MAX_ROTATION_DEG],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { translateY: CARD_HEIGHT / 2 },
        { rotate: `${rotation}deg` },
        { translateY: -CARD_HEIGHT / 2 },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.cardWrapper, { height: CARD_HEIGHT }, topCardStyle]}
      >
        <SwipeCard
          profile={profile}
          isTop={true}
          translateX={translateX}
          userLat={userLat}
          userLng={userLng}
          userEmojis={userEmojis}
        />
      </Animated.View>
    </GestureDetector>
  );
});

// ═════════════════════════════════════════════════════════════
// Animated Action Button
// ═════════════════════════════════════════════════════════════

function ActionButton({
  emoji,
  label,
  labelColor,
  borderColor,
  onPress,
}: {
  emoji: string;
  label: string;
  labelColor: string;
  borderColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    RNAnimated.spring(scale, {
      toValue: 0.85,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <RNAnimated.View
        style={[
          styles.actionButton,
          {
            backgroundColor: "#FFF",
            borderWidth: 2.5,
            borderColor,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
        <Text style={[styles.actionLabel, { color: labelColor }]}>{label}</Text>
      </RNAnimated.View>
    </Pressable>
  );
}

// ═════════════════════════════════════════════════════════════
// Main Stack
// ═════════════════════════════════════════════════════════════

export default function SwipeCardStack() {
  const { session, devMode } = useAuth();
  const [profiles, setProfiles] = useState<SwipeProfile[]>(MOCK_PROFILES);
  const [userLat, setUserLat] = useState(MOCK_USER_LAT);
  const [userLng, setUserLng] = useState(MOCK_USER_LNG);
  const [userEmojis, setUserEmojis] = useState<string[]>(MOCK_USER_EMOJIS);
  const [genderFilters, setGenderFilters] = useState<GenderValue[]>(["male", "female", "nonbinary"]);
  const [feedLoaded, setFeedLoaded] = useState(false);

  // ─── Read gender filters from AsyncStorage on focus ────────
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("gender_filters").then((val) => {
        if (val) {
          try {
            const parsed = JSON.parse(val) as GenderValue[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setGenderFilters(parsed);
              return;
            }
          } catch {}
        }
        setGenderFilters(["male", "female", "nonbinary"]);
      });
    }, [])
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sizzle, setSizzle] = useState<{
    emojis: string[];
    direction: "left" | "right";
    key: number;
  } | null>(null);

  // Match modal state
  const [matchData, setMatchData] = useState<{
    matchId: string;
    otherUser: Profile;
    otherEmojis: ProfileEmoji[];
    otherPhoto: ProfilePhoto | null;
    emojiMatchCount: number;
    isPerfect: boolean;
    icebreakerQuestion: string | null;
  } | null>(null);

  // Undo state — stores the last swipe so it can be reversed
  const [lastSwipe, setLastSwipe] = useState<{
    swipedId: string;
    direction: "left" | "right";
  } | null>(null);

  // Shared drag progress for behind-card breathing
  const dragProgress = useSharedValue(0);

  // Rotating themed emojis for action buttons
  const [vibeEmoji, passEmoji] = useMemo(
    () => EMOJI_THEMES[currentIndex % EMOJI_THEMES.length],
    [currentIndex]
  );

  // Ref for programmatic swipes via buttons
  const topCardRef = useRef<SwipeableTopCardHandle>(null);

  // ─── Load real discovery feed when authenticated ──────────
  useEffect(() => {
    if (!session?.user || devMode) {
      setFeedLoaded(true);
      return;
    }

    (async () => {
      try {
        const ownProfile = await fetchOwnProfile(session.user.id);
        if (!ownProfile || (ownProfile.latitude === 0 && ownProfile.longitude === 0)) {
          // No profile or no valid location — fall back to mock data
          setFeedLoaded(true);
          return;
        }

        setUserLat(ownProfile.latitude);
        setUserLng(ownProfile.longitude);

        // Fetch current user's emojis for match highlighting
        const { data: myEmojis } = await supabase
          .from("profile_emojis")
          .select("emoji")
          .eq("user_id", session.user.id)
          .order("position");
        if (myEmojis && myEmojis.length > 0) {
          setUserEmojis(myEmojis.map((e) => e.emoji));
        }

        const feed = await fetchDiscoveryFeed(
          session.user.id,
          ownProfile.latitude,
          ownProfile.longitude,
          ownProfile.search_radius_miles,
          null // fetch all genders, filter client-side via genderFilters
        );

        // Always append mock profiles after real results for testing
        const combined = [...feed, ...MOCK_PROFILES];
        setProfiles(combined);
        setCurrentIndex(0);
      } catch {
        // Network error — keep mock profiles
      } finally {
        setFeedLoaded(true);
      }
    })();
  }, [session, devMode]);

  // ─── Re-fetch user emojis when tab gains focus ─────────
  // (e.g. after editing emojis on the profile screen)
  useFocusEffect(
    useCallback(() => {
      if (!session?.user || devMode) return;

      (async () => {
        const { data: myEmojis } = await supabase
          .from("profile_emojis")
          .select("emoji")
          .eq("user_id", session.user.id)
          .order("position");
        if (myEmojis && myEmojis.length > 0) {
          setUserEmojis(myEmojis.map((e) => e.emoji));
        }
      })();
    }, [session, devMode])
  );

  // ─── Prefetch images for upcoming cards ──────────────────
  useEffect(() => {
    for (
      let i = currentIndex + 1;
      i < Math.min(currentIndex + 4, profiles.length);
      i++
    ) {
      const url = profiles[i]?.photo.url;
      if (url) Image.prefetch(url);
    }
  }, [currentIndex, profiles]);

  // ─── Filter profiles locally by gender preferences ──────
  const filteredProfiles = useMemo(() => {
    // All 3 selected = show everyone
    if (genderFilters.length === 3) return profiles;
    return profiles.filter((p) => genderFilters.includes(p.profile.gender as GenderValue));
  }, [profiles, genderFilters]);

  // ─── Swipe complete handler ─────────────────────────────
  const onSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      // Fire direction-specific emoji confetti + sound
      const emojis = direction === "right" ? VIBE_EMOJIS : PASS_EMOJIS;
      setSizzle({ emojis, direction, key: Date.now() });
      playSwipeSound();

      // Save last swipe for undo (before advancing index)
      const swipedProfile = filteredProfiles[currentIndex];
      if (swipedProfile) {
        setLastSwipe({ swipedId: swipedProfile.profile.id, direction });
      }

      // Check for mock pre-swiped match (local simulation)
      const isMock = swipedProfile?.profile.id.startsWith("mock-");
      if (
        direction === "right" &&
        swipedProfile &&
        isMock &&
        MOCK_PRE_SWIPED_IDS.has(swipedProfile.profile.id)
      ) {
        // Simulate instant match locally — no DB needed
        const emojiMatchCount = swipedProfile.emojis.filter((e) =>
          userEmojis.includes(e.emoji)
        ).length;
        setLastSwipe(null);
        setMatchData({
          matchId: `mock-match-${swipedProfile.profile.id}`,
          otherUser: swipedProfile.profile,
          otherEmojis: swipedProfile.emojis,
          otherPhoto: swipedProfile.photo,
          emojiMatchCount,
          isPerfect: emojiMatchCount === 5,
          icebreakerQuestion: getNextMockIcebreaker(),
        });
      } else if (session?.user && swipedProfile && !isMock) {
        // Record real swipe to Supabase
        recordSwipe(
          session.user.id,
          swipedProfile.profile.id,
          direction
        ).then((result) => {
          if (result.matched) {
            // Clear undo — can't undo a match from the card stack
            setLastSwipe(null);
            setMatchData({
              matchId: result.match.id,
              otherUser: result.otherUser,
              otherEmojis: result.otherEmojis,
              otherPhoto: result.otherPhoto,
              emojiMatchCount: result.match.emoji_match_count,
              isPerfect: result.match.is_emoji_perfect,
              icebreakerQuestion: result.icebreakerQuestion,
            });
          }
        }).catch(() => {
          // Swipe recording failed
        });
      }

      // Just advance the index — no shared value reset needed!
      // The old SwipeableTopCard stays at EXIT_X until React unmounts it.
      // The new SwipeableTopCard mounts with fresh translateX = 0.
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, session, filteredProfiles, userEmojis]
  );

  // ─── Undo handler ──────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!lastSwipe || currentIndex === 0) return;

    // Premium gate check
    if (PREMIUM_GATES.undoSwipe) {
      Alert.alert(
        "Premium Feature",
        "Undo swipe is a premium feature. Upgrade to unlock!",
        [{ text: "OK" }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Delete swipe from Supabase (+ any match it created)
    if (session?.user) {
      undoSwipe(session.user.id, lastSwipe.swipedId).catch(() => {
        // DB delete failed — UI still reverts (best effort)
      });
    }

    // Go back one card — React re-mounts SwipeableTopCard with fresh translateX=0
    setCurrentIndex((prev) => prev - 1);
    setLastSwipe(null);
  }, [lastSwipe, currentIndex, session]);

  // dragProgress is NOT reset here — it stays at ~1 after a swipe so
  // the behind card matches the top card position during the mount transition.
  // It gets reset at the start of the NEXT pan gesture (onStart), when the
  // user's finger covers the card and any behind-card shift is invisible.

  // ─── Behind card styles (use dragProgress) ────────────────
  const secondCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(dragProgress.value, [0, 1], [0.96, 1]) },
      { translateY: interpolate(dragProgress.value, [0, 1], [8, 0]) },
    ],
    opacity: 1,
  }));

  const thirdCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(dragProgress.value, [0, 1], [0.92, 0.96]) },
      { translateY: interpolate(dragProgress.value, [0, 1], [16, 8]) },
    ],
    opacity: interpolate(dragProgress.value, [0, 1], [0.85, 1]),
  }));

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [genderFilters]);

  // ─── Render ─────────────────────────────────────────────
  const visibleProfiles = filteredProfiles.slice(
    currentIndex,
    currentIndex + MAX_VISIBLE
  );
  const allSwiped = currentIndex >= filteredProfiles.length;

  const getCardStyle = (index: number) => {
    if (index === 1) return secondCardStyle;
    return thirdCardStyle;
  };

  return (
    <View style={styles.container}>
      {/* Card stack area — empty state sits behind cards */}
      <View style={styles.cardArea}>
        {/* Empty state — always rendered, revealed when last card exits */}
        {allSwiped && (
          <View style={StyleSheet.absoluteFill}>
            <LottieEmptyState
              title="That's everyone nearby!"
              subtitle="Check back soon — new friends are joining every day"
            >
              {!session?.user && (
                <Pressable
                  style={styles.refreshButton}
                  onPress={() => setCurrentIndex(0)}
                >
                  <Text style={styles.refreshText}>Start Over</Text>
                </Pressable>
              )}
            </LottieEmptyState>
          </View>
        )}

        {/* Behind cards (rendered first = lower z-index) */}
        {[...visibleProfiles]
          .slice(1)
          .reverse()
          .map((profile, reverseIdx) => {
            const cardIndex =
              visibleProfiles.length - 1 - reverseIdx;
            return (
              <View
                key={profile.profile.id}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                <Animated.View
                  style={[
                    styles.cardWrapper,
                    { height: CARD_HEIGHT },
                    getCardStyle(cardIndex),
                  ]}
                >
                  <SwipeCard
                    profile={profile}
                    isTop={false}
                    translateX={dragProgress}
                    userLat={userLat}
                    userLng={userLng}
                    userEmojis={userEmojis}
                  />
                </Animated.View>
              </View>
            );
          })}

        {/* Top card — owns its own gesture + translateX/Y */}
        {visibleProfiles[0] && (
          <SwipeableTopCard
            key={visibleProfiles[0].profile.id}
            ref={topCardRef}
            profile={visibleProfiles[0]}
            dragProgress={dragProgress}
            onSwipeComplete={onSwipeComplete}
            userLat={userLat}
            userLng={userLng}
            userEmojis={userEmojis}
          />
        )}
      </View>

      {/* Emoji sizzle overlay — zIndex/elevation above cards */}
      {sizzle && (
        <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 100 }} pointerEvents="none">
          <EmojiSizzle
            key={sizzle.key}
            emojis={sizzle.emojis}
            direction={sizzle.direction}
            onComplete={() => setSizzle(null)}
          />
        </View>
      )}

      {/* Action buttons */}
      {!allSwiped && (
        <View style={styles.actions}>
          <ActionButton
            emoji={passEmoji}
            label="Pass"
            labelColor={COLORS.passButton}
            borderColor="#FFD6D6"
            onPress={() => topCardRef.current?.triggerSwipe("left")}
          />
          {lastSwipe && !matchData && (
            <Pressable
              onPress={handleUndo}
              style={styles.undoButton}
            >
              <Text style={{ fontSize: 18 }}>↩️</Text>
              <Text style={styles.undoLabel}>Undo</Text>
            </Pressable>
          )}
          <ActionButton
            emoji={vibeEmoji}
            label="Vibe"
            labelColor={COLORS.vibeDark}
            borderColor="#C6F6D5"
            onPress={() => topCardRef.current?.triggerSwipe("right")}
          />
        </View>
      )}

      {/* Match celebration modal */}
      {matchData && (
        <MatchModal
          visible={!!matchData}
          otherUser={matchData.otherUser}
          otherEmojis={matchData.otherEmojis}
          otherPhoto={matchData.otherPhoto}
          emojiMatchCount={matchData.emojiMatchCount}
          isPerfect={matchData.isPerfect}
          userEmojis={userEmojis}
          icebreakerQuestion={matchData.icebreakerQuestion}
          onClose={() => setMatchData(null)}
          onSendEmojis={() => {
            const matchId = matchData.matchId;
            const question = matchData.icebreakerQuestion;
            setMatchData(null);
            router.push({
              pathname: "/chat/[matchId]",
              params: { matchId, icebreakerQuestion: question ?? "" },
            });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  cardArea: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  cardWrapper: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 44,
    paddingVertical: 10,
    paddingBottom: 4,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    marginTop: -1,
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  undoLabel: {
    fontSize: 8,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginTop: -1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 22,
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  refreshText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
