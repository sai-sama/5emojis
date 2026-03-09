import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

const BRAND_EMOJIS = ["👋", "✨", "🎉", "💜", "🫶"];

type BrandLogoProps = {
  size?: "compact" | "large";
  showEmojis?: boolean;
  onPress?: () => void;
};

const SIZES = {
  compact: {
    badgeSize: 24,
    badgeFontSize: 14,
    textFontSize: 20,
    sparkleFontSize: 14,
    gap: 2,
    sparkleGap: 1,
  },
  large: {
    badgeSize: 44,
    badgeFontSize: 26,
    textFontSize: 36,
    sparkleFontSize: 22,
    gap: 4,
    sparkleGap: 2,
    emojiFontSize: 32,
    emojiGap: 6,
    emojiMarginTop: 6,
  },
};

export default function BrandLogo({ size = "compact", showEmojis = false, onPress }: BrandLogoProps) {
  const s = SIZES[size];
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper {...wrapperProps} style={styles.container}>
      <View style={styles.logoRow}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: s.badgeSize,
            height: s.badgeSize,
            borderRadius: s.badgeSize / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            { fontSize: s.badgeFontSize, lineHeight: s.badgeSize },
          ]}
        >
          5
        </Text>
      </LinearGradient>

      <Text
        style={[
          styles.brandText,
          { fontSize: s.textFontSize, marginLeft: s.gap },
        ]}
      >
        Emojis
      </Text>

      <Text
        style={[
          styles.sparkle,
          { fontSize: s.sparkleFontSize, marginLeft: s.sparkleGap },
        ]}
      >
        ✦
      </Text>
      </View>

      {showEmojis && size === "large" && (
        <View style={[styles.emojiRow, { gap: s.emojiGap, marginTop: s.emojiMarginTop }]}>
          {BRAND_EMOJIS.map((emoji, i) => (
            <Text key={i} style={{ fontSize: s.emojiFontSize }}>
              {emoji}
            </Text>
          ))}
        </View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFF",
    fontFamily: fonts.heading,
    textAlign: "center",
    textAlignVertical: "center",
  },
  brandText: {
    fontFamily: fonts.heading,
    color: COLORS.primary,
  },
  sparkle: {
    color: COLORS.primaryLight,
  },
});
