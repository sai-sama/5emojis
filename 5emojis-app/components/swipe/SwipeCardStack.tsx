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
import { COLORS, FREE_DAILY_RIGHT_SWIPES } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { SwipeCard } from "./SwipeCard";
import { EmojiSizzle } from "./EmojiSizzle";
import MatchModal from "../MatchModal";
import { useAuth } from "../../lib/auth-context";
import { usePremium } from "../../lib/premium-context";
import { recordSwipe, undoSwipe, type MatchResult } from "../../lib/swipe-service";
import {
  getDailySwipeCounts,
  incrementRightSwipe,
  canSwipeRight,
  canSuperLike,
  getRemainingRightSwipes,
  getRemainingSuperLikes,
  recordSuperLike,
} from "../../lib/swipe-limits";
import {
  fetchDiscoveryFeed,
  fetchOwnProfile,
  type DiscoveryProfile,
} from "../../lib/discovery-service";
import { supabase } from "../../lib/supabase";
import { Profile, ProfileEmoji, ProfilePhoto } from "../../lib/types";
import { type SwipeProfile, calculateAge } from "./mockProfiles";
import LottieEmptyState from "../lottie/LottieEmptyState";
import { playSwipeSound, isSoundMuted } from "../../lib/sounds";
import type { GenderValue } from "../../lib/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useUndo } from "../../lib/undo-context";
import SwipeTutorial from "./SwipeTutorial";
import { notifyNewMatch, notifyNewLike, notifyNewSuperLike } from "../../lib/push-notifications";
import { logError } from "../../lib/error-logger";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Geometry ───────────────────────────────────────────────
const CARD_HEIGHT = SCREEN_HEIGHT * 0.78;

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
    onTap?: () => void;
  }
>(function SwipeableTopCard({ profile, dragProgress, onSwipeComplete, userLat, userLng, userEmojis, onTap }, ref) {
  // ─── Per-card shared values (never shared, never reset) ───
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureContext = useSharedValue({ x: 0, y: 0 });
  const hasHitThreshold = useSharedValue(false);


  // ─── Haptic helpers (called via runOnJS from worklets) ──────
  const hapticThreshold = () => {
    if (!isSoundMuted()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const hapticUncross = () => {
    if (!isSoundMuted()) Haptics.selectionAsync();
  };
  const hapticSwipeRight = () => {
    if (!isSoundMuted()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const hapticSwipeLeft = () => {
    if (!isSoundMuted()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };
  const hapticSnapBack = () => {
    if (!isSoundMuted()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Expose triggerSwipe for button presses (JS thread) ────
  useImperativeHandle(ref, () => ({
    triggerSwipe(direction: "left" | "right") {
      if (!isSoundMuted()) {
        if (direction === "right") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
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

  // ─── Tap gesture — navigate to profile ──────────────────
  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onTap) runOnJS(onTap)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

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
    <GestureDetector gesture={composedGesture}>
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
          showEmojis={true}
        />
      </Animated.View>
    </GestureDetector>
  );
});

// ═════════════════════════════════════════════════════════════
// Main Stack
// ═════════════════════════════════════════════════════════════

export default function SwipeCardStack() {
  const { session, devMode } = useAuth();
  const { canAccessPremium } = usePremium();
  const { setUndo } = useUndo();
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [userLat, setUserLat] = useState(0);
  const [userLng, setUserLng] = useState(0);
  const [userEmojis, setUserEmojis] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [genderFilters, setGenderFilters] = useState<GenderValue[]>(["male", "female", "nonbinary"]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [hasHiddenEmojis, setHasHiddenEmojis] = useState(false);

  // ─── Daily swipe tracking ───────────────────────────────────
  const [dailyCounts, setDailyCounts] = useState({ rightCount: 0, superLikeCount: 0 });
  const remainingSwipes = getRemainingRightSwipes(dailyCounts, canAccessPremium);
  const canSuperLikeNow = canSuperLike(dailyCounts, canAccessPremium);

  // Load daily counts on focus
  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        getDailySwipeCounts(session.user.id).then(setDailyCounts);
      }
    }, [session])
  );

  // ─── First-time swipe tutorial ─────────────────────────────
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("swipe_tutorial_seen").then((val) => {
      if (!val) setShowTutorial(true);
    });
  }, []);

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false);
    AsyncStorage.setItem("swipe_tutorial_seen", "true");
  }, []);

  // ─── Age filter state ──────────────────────────────────────
  const [ageFilterMin, setAgeFilterMin] = useState(18);
  const [ageFilterMax, setAgeFilterMax] = useState(99);

  // ─── Read filters from AsyncStorage on focus ──────────────
  // Only update state if the values actually changed (avoids resetting currentIndex)
  useFocusEffect(
    useCallback(() => {
      // Gender filters
      AsyncStorage.getItem("gender_filters").then((val) => {
        let newFilters: GenderValue[] = ["male", "female", "nonbinary"];
        if (val) {
          try {
            const parsed = JSON.parse(val) as GenderValue[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              newFilters = parsed;
            }
          } catch (err: any) {
            logError(err, { screen: "SwipeCardStack", context: "parse_gender_filters" });
          }
        }
        setGenderFilters((prev) => {
          if (prev.length === newFilters.length && prev.every((g, i) => g === newFilters[i])) {
            return prev;
          }
          return newFilters;
        });
      });
      // Age filters
      Promise.all([
        AsyncStorage.getItem("age_filter_min"),
        AsyncStorage.getItem("age_filter_max"),
      ]).then(([minVal, maxVal]) => {
        const newMin = minVal ? parseInt(minVal, 10) : 18;
        const newMax = maxVal ? parseInt(maxVal, 10) : 99;
        setAgeFilterMin((prev) => (prev === newMin ? prev : newMin));
        setAgeFilterMax((prev) => (prev === newMax ? prev : newMax));
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

  // Ref for programmatic swipes (e.g. shake-to-undo)
  const topCardRef = useRef<SwipeableTopCardHandle>(null);

  // ─── Load discovery feed (re-fetches on tab focus to exclude swiped profiles) ──
  const loadFeed = useCallback(async () => {
    if (!session?.user || devMode) {
      setFeedLoaded(true);
      return;
    }

    try {
      const ownProfile = await fetchOwnProfile(session.user.id);
      if (!ownProfile || (ownProfile.latitude === 0 && ownProfile.longitude === 0)) {
        setFeedLoaded(true);
        return;
      }

      setUserLat(ownProfile.latitude);
      setUserLng(ownProfile.longitude);
      setUserName(ownProfile.name);
      setHasHiddenEmojis((ownProfile.hidden_emojis ?? []).length > 0);

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
        null, // fetch all genders, filter client-side via genderFilters
        ownProfile.hidden_emojis ?? []
      );

      setProfiles(feed);
      setCurrentIndex(0);
      setFeedError(false);
    } catch (err: any) {
      // Network error — show retry UI
      logError(err, { screen: "SwipeCardStack", context: "load_discovery_feed" });
      setFeedError(true);
    } finally {
      setFeedLoaded(true);
    }
  }, [session, devMode]);

  // Re-fetch on tab focus — ensures swiped profiles are excluded from the DB query
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  // User emojis are now refreshed inside loadFeed() on every tab focus

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

  // ─── Filter profiles locally by gender + age preferences ──
  const filteredProfiles = useMemo(() => {
    const allGenders = genderFilters.length === 3;
    const defaultAge = ageFilterMin <= 18 && ageFilterMax >= 99;

    if (allGenders && defaultAge) return profiles;

    return profiles.filter((p) => {
      if (!allGenders && !genderFilters.includes(p.profile.gender as GenderValue)) return false;
      if (!defaultAge && p.profile.dob) {
        const age = calculateAge(p.profile.dob);
        if (age < ageFilterMin || age > ageFilterMax) return false;
      }
      return true;
    });
  }, [profiles, genderFilters, ageFilterMin, ageFilterMax]);

  // ─── Swipe complete handler ─────────────────────────────
  const onSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      // Enforce swipe limit for free users on right swipes
      if (direction === "right" && !canSwipeRight(dailyCounts, canAccessPremium)) {
        router.push("/premium");
        return;
      }

      // Fire direction-specific emoji confetti + sound
      const emojis = direction === "right" ? VIBE_EMOJIS : PASS_EMOJIS;
      setSizzle({ emojis, direction, key: Date.now() });
      playSwipeSound();

      // Save last swipe for undo — only for left swipes (accidental passes).
      // Right swipes are intentional vibes; no need to undo those.
      const swipedProfile = filteredProfiles[currentIndex];
      if (swipedProfile && direction === "left") {
        setLastSwipe({ swipedId: swipedProfile.profile.id, direction });
      } else {
        setLastSwipe(null);
      }

      // Optimistically increment daily count BEFORE async call to prevent rapid-swipe bypass
      if (direction === "right") {
        setDailyCounts((prev) => ({ ...prev, rightCount: prev.rightCount + 1 }));
      }

      // Record swipe to Supabase + persist daily count
      if (session?.user && swipedProfile) {
        recordSwipe(
          session.user.id,
          swipedProfile.profile.id,
          direction
        ).then((result) => {
          if (!result.success) {
            logError(new Error(result.error), { screen: "SwipeCardStack", context: "record_swipe" });
            return;
          }

          if (direction === "right") {
            incrementRightSwipe(session.user.id).catch((err: any) =>
              logError(err, { screen: "SwipeCardStack", context: "increment_right_swipe" })
            );
          }

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

            // Notify the other user about the match
            if (userName) {
              notifyNewMatch(
                result.otherUser.id,
                userName,
                result.match.id
              ).catch(() => {}); // best-effort push
            }
          } else if (direction === "right" && userName) {
            // Not a match — notify them someone liked them
            notifyNewLike(
              swipedProfile.profile.id,
              userName
            ).catch(() => {}); // best-effort push
          }
        }).catch((err: any) => {
          // Swipe recording failed
          logError(err, { screen: "SwipeCardStack", context: "record_swipe" });
        });
      }

      // Just advance the index — no shared value reset needed!
      // The old SwipeableTopCard stays at EXIT_X until React unmounts it.
      // The new SwipeableTopCard mounts with fresh translateX = 0.
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, session, filteredProfiles, userEmojis, dailyCounts, canAccessPremium]
  );

  // ─── Super like handler ────────────────────────────────────
  const handleSuperLike = useCallback(() => {
    if (!session?.user || !canAccessPremium) {
      router.push("/premium");
      return;
    }
    if (!canSuperLikeNow) {
      Alert.alert("Daily Limit", "You've used all 3 super likes today. Try again tomorrow!");
      return;
    }
    const swipedProfile = filteredProfiles[currentIndex];
    if (!swipedProfile) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSizzle({ emojis: ["⭐", "💜", "✨", "🌟", "💫"], direction: "right", key: Date.now() });
    playSwipeSound();

    // Record super like + right swipe
    recordSuperLike(session.user.id, swipedProfile.profile.id).then(() => {
      setDailyCounts((prev) => ({ ...prev, superLikeCount: prev.superLikeCount + 1 }));
    }).catch((err: any) => {
      logError(err, { screen: "SwipeCardStack", context: "record_super_like" });
    });
    recordSwipe(session.user.id, swipedProfile.profile.id, "right", true).then((result) => {
      if (!result.success) {
        logError(new Error(result.error), { screen: "SwipeCardStack", context: "super_like" });
        return;
      }

      incrementRightSwipe(session.user.id).catch((err: any) =>
        logError(err, { screen: "SwipeCardStack", context: "increment_right_swipe_super" })
      );
      setDailyCounts((prev) => ({ ...prev, rightCount: prev.rightCount + 1 }));
      if (result.matched) {
        setMatchData({
          matchId: result.match.id,
          otherUser: result.otherUser,
          otherEmojis: result.otherEmojis,
          otherPhoto: result.otherPhoto,
          emojiMatchCount: result.match.emoji_match_count,
          isPerfect: result.match.is_emoji_perfect,
          icebreakerQuestion: result.icebreakerQuestion,
        });
        if (userName) {
          notifyNewMatch(result.otherUser.id, userName, result.match.id);
        }
      } else if (userName) {
        // Not a match — notify them someone super liked them
        notifyNewSuperLike(
          swipedProfile.profile.id,
          userName
        ).catch(() => {}); // best-effort push
      }
    }).catch((err: any) => {
      logError(err, { screen: "SwipeCardStack", context: "super_like" });
    });

    setCurrentIndex((prev) => prev + 1);
  }, [session, canAccessPremium, canSuperLikeNow, filteredProfiles, currentIndex, userName]);

  // ─── Undo handler ──────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!lastSwipe || currentIndex === 0) return;

    // Premium gate check
    if (!canAccessPremium) {
      router.push("/premium");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Delete swipe from Supabase (+ any match it created)
    if (session?.user) {
      undoSwipe(session.user.id, lastSwipe.swipedId).catch((err: any) => {
        // DB delete failed — UI still reverts (best effort)
        logError(err, { screen: "SwipeCardStack", context: "undo_swipe" });
      });
    }

    // Go back one card — React re-mounts SwipeableTopCard with fresh translateX=0
    setCurrentIndex((prev) => prev - 1);
    setLastSwipe(null);
  }, [lastSwipe, currentIndex, session]);

  // ─── Expose undo to tab bar via context ────────────────────
  useEffect(() => {
    if (lastSwipe && !matchData) {
      setUndo(handleUndo);
    } else {
      setUndo(null);
    }
  }, [lastSwipe, matchData, handleUndo, setUndo]);

  // Clean up on unmount
  useEffect(() => {
    return () => setUndo(null);
  }, [setUndo]);

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

  // ─── Card tap tooltip ─────────────────────────────────────
  const [showTapHint, setShowTapHint] = useState(false);
  const tapHintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCardTap = useCallback(() => {
    // If 5/5 perfect emoji match, let them view the full profile
    const topProfile = visibleProfiles[0];
    if (topProfile) {
      const userEmojiSet = new Set(userEmojis);
      const matchCount = topProfile.emojis.filter((e) => userEmojiSet.has(e.emoji)).length;
      if (matchCount === 5) {
        router.push(`/user/${topProfile.profile.id}`);
        return;
      }
    }
    setShowTapHint(true);
    if (tapHintTimeout.current) clearTimeout(tapHintTimeout.current);
    tapHintTimeout.current = setTimeout(() => setShowTapHint(false), 2000);
  }, [visibleProfiles, userEmojis]);

  // Clean up tap hint timeout on unmount
  useEffect(() => {
    return () => {
      if (tapHintTimeout.current) clearTimeout(tapHintTimeout.current);
    };
  }, []);

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
        {/* Error state — network error loading feed */}
        {feedError && allSwiped && (
          <View style={StyleSheet.absoluteFill}>
            <LottieEmptyState
              title="Couldn't load profiles"
              subtitle="Check your internet connection and try again."
            >
              <View style={styles.emptyActions}>
                <Pressable style={styles.refreshButton} onPress={loadFeed}>
                  <Ionicons name="refresh-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.refreshText}>Retry</Text>
                </Pressable>
              </View>
            </LottieEmptyState>
          </View>
        )}

        {/* Empty state — always rendered, revealed when last card exits */}
        {allSwiped && !feedError && (
          <View style={StyleSheet.absoluteFill}>
            <LottieEmptyState
              title="That's everyone nearby!"
              subtitle={
                hasHiddenEmojis
                  ? "Your hidden emojis filter may be narrowing results. Try adjusting it, expanding your radius, or check back soon!"
                  : "New friends are joining every day. Try expanding your search radius to find more people."
              }
            >
              <View style={styles.emptyActions}>
                <Pressable
                  style={styles.refreshButton}
                  onPress={() => router.push("/profile/location")}
                >
                  <Ionicons name="expand-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.refreshText}>Expand Radius</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => router.push("/profile")}
                >
                  <Ionicons name="options-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.secondaryButtonText}>Adjust Filters</Text>
                </Pressable>
                {filteredProfiles.length > 0 && (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => setCurrentIndex(0)}
                  >
                    <Text style={styles.secondaryButtonText}>Start Over</Text>
                  </Pressable>
                )}
              </View>
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
                    showEmojis={true}
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
            onTap={handleCardTap}
          />
        )}

        {/* Tap hint tooltip */}
        {showTapHint && (
          <View style={styles.tapHint}>
            <Ionicons name="lock-closed" size={13} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.tapHintText}>Match to see their full profile</Text>
          </View>
        )}

        {/* Super Like floating button — premium only, centered above emojis */}
        {canAccessPremium && visibleProfiles.length > 0 && !allSwiped && (
          <Pressable
            testID="super-like-button"
            style={styles.superLikeFloating}
            onPress={handleSuperLike}
          >
            <View style={[styles.superLikeFloatingInner, !canSuperLikeNow && styles.superLikeFloatingDisabled]}>
              <Ionicons name="star" size={22} color={canSuperLikeNow ? "#FFD700" : "rgba(255,215,0,0.4)"} />
              <Text style={[styles.superLikeFloatingText, !canSuperLikeNow && { opacity: 0.5 }]}>
                {canSuperLikeNow ? getRemainingSuperLikes(dailyCounts) : "0"}
              </Text>
            </View>
          </Pressable>
        )}

      </View>

      {/* First-time swipe tutorial overlay */}
      {showTutorial && <SwipeTutorial onDismiss={dismissTutorial} />}

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
  },
  cardWrapper: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 0,
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
  emptyActions: {
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },

  tapHint: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tapHintText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
  // ─── Super Like floating button (centered above emojis) ────
  superLikeFloating: {
    position: "absolute",
    bottom: 175,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  superLikeFloatingInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.35)",
  },
  superLikeFloatingDisabled: {
    opacity: 0.5,
  },
  superLikeFloatingText: {
    color: "#FFD700",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
