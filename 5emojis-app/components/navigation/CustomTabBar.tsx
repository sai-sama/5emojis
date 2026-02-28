import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

const TAB_CONFIG: Record<string, { emoji: string; label: string }> = {
  vibes: { emoji: "🤝", label: "Vibes" },
  index: { emoji: "✦", label: "Discover" },
  messages: { emoji: "💬", label: "Messages" },
};

const TAB_ORDER = ["vibes", "index", "messages"];

function SideTab({
  routeName,
  focused,
  onPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const config = TAB_CONFIG[routeName] ?? { emoji: "?", label: routeName };

  useEffect(() => {
    if (focused) {
      scale.setValue(0.8);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [focused]);

  return (
    <TouchableOpacity
      style={styles.sideTab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.Text style={[styles.sideEmoji, { transform: [{ scale }] }]}>
        {config.emoji}
      </Animated.Text>
      <Text
        style={[
          styles.sideLabel,
          focused && styles.sideLabelFocused,
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
      {focused && <View style={styles.focusDot} />}
    </TouchableOpacity>
  );
}

function CenterTab({
  focused,
  onPress,
}: {
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      scale.setValue(0.85);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [focused]);

  return (
    <TouchableOpacity
      style={styles.centerTouchable}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Animated.View style={[styles.centerButton, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={["#7C3AED", "#9B59F0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerGradient}
        >
          <Text style={styles.centerEmoji}>✦</Text>
        </LinearGradient>
      </Animated.View>
      <Text
        style={[
          styles.centerLabel,
          focused && styles.centerLabelFocused,
        ]}
      >
        Discover
      </Text>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {TAB_ORDER.map((routeName, idx) => {
        const routeIndex = state.routes.findIndex((r) => r.name === routeName);
        if (routeIndex === -1) return null;
        const focused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[routeIndex].key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented && !focused) {
            navigation.navigate(routeName);
          }
        };

        if (routeName === "index") {
          return (
            <CenterTab key="center" focused={focused} onPress={onPress} />
          );
        }

        return (
          <SideTab
            key={routeName}
            routeName={routeName}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingTop: 6,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },

  // Side tabs
  sideTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  sideEmoji: {
    fontSize: 22,
  },
  sideLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sideLabelFocused: {
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  focusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },

  // Center button
  centerTouchable: {
    alignItems: "center",
    marginTop: -20,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  centerGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerEmoji: {
    fontSize: 26,
    color: "#FFF",
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  centerLabelFocused: {
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
});
