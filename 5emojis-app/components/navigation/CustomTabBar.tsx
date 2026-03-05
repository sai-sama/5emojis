import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import { useUndo } from "../../lib/undo-context";
import { useUnread } from "../../lib/unread-context";

const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconFocused: keyof typeof Ionicons.glyphMap; label: string }
> = {
  index: { icon: "compass-outline", iconFocused: "compass", label: "Discover" },
  vibes: { icon: "people-outline", iconFocused: "people", label: "Friends" },
};

const TAB_ORDER = ["index", "vibes"];

function AnimatedTab({
  routeName,
  focused,
  onPress,
  badge,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
  badge?: number;
}) {
  const config = TAB_CONFIG[routeName] ?? { icon: "help-outline" as const, iconFocused: "help" as const, label: routeName };

  // Animated values
  const scale = useSharedValue(1);
  const pillOpacity = useSharedValue(0);
  const breathe = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      // Bounce in
      scale.value = withSequence(
        withTiming(0.8, { duration: 80 }),
        withSpring(1, { damping: 8, stiffness: 300 })
      );
      // Show pill
      pillOpacity.value = withSpring(1, { damping: 15 });
      // Subtle breathing on active icon
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      // Color transition
      colorProgress.value = withTiming(1, { duration: 200 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      pillOpacity.value = withTiming(0, { duration: 150 });
      breathe.value = withTiming(1, { duration: 200 });
      colorProgress.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * breathe.value },
    ],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scale: pillOpacity.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      ["rgba(255,255,255,0.55)", "#FFFFFF"]
    ),
  }));

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityLabel={`${config.label}${badge ? `, ${badge} unread` : ""}`}
      accessibilityState={{ selected: focused }}
    >
      {/* Active pill background */}
      <Animated.View style={[styles.activePill, pillStyle]} />

      <Animated.View style={[iconStyle, { position: "relative" }]}>
        <Ionicons
          name={focused ? config.iconFocused : config.icon}
          size={22}
          color={focused ? "#FFF" : "rgba(255,255,255,0.55)"}
        />
        {!!badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelFocused,
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { canUndo, onUndo } = useUndo();
  const { unreadCount } = useUnread();

  // Only show undo when on Discover tab AND there's something to undo
  const discoverIndex = state.routes.findIndex((r) => r.name === "index");
  const isOnDiscover = discoverIndex !== -1 && state.index === discoverIndex;
  const showUndo = canUndo && isOnDiscover;

  const makeTabProps = (routeName: string) => {
    const routeIndex = state.routes.findIndex((r) => r.name === routeName);
    const focused = routeIndex !== -1 && state.index === routeIndex;
    const onPress = () => {
      if (routeIndex === -1) return;
      const event = navigation.emit({
        type: "tabPress",
        target: state.routes[routeIndex].key,
        canPreventDefault: true,
      });
      if (!event.defaultPrevented && !focused) {
        navigation.navigate(routeName);
      }
    };
    return { routeName, focused, onPress };
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      <AnimatedTab {...makeTabProps("index")} />

      {/* Center undo button — only visible when relevant */}
      {showUndo && (
        <TouchableOpacity
          style={styles.undoTab}
          onPress={onUndo!}
          activeOpacity={0.6}
        >
          <Ionicons
            name="arrow-undo"
            size={20}
            color="#FFF"
          />
          <Text style={[styles.undoLabel, styles.undoLabelActive]}>
            Undo
          </Text>
        </TouchableOpacity>
      )}

      <AnimatedTab {...makeTabProps("vibes")} badge={unreadCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    backgroundColor: "#7C3AED",
    paddingTop: 8,
    borderTopWidth: 0,
    shadowColor: "#5B21B6",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: 2,
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  tabLabelFocused: {
    fontFamily: fonts.bodySemiBold,
  },
  // ─── Center undo button ─────────────────────────
  undoTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  undoLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  undoLabelActive: {
    color: "#FFF",
    fontFamily: fonts.bodySemiBold,
  },
  // ─── Unread badge ──────────────────────────────
  badge: {
    position: "absolute" as const,
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF6B6B",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
});
