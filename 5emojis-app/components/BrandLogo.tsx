import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";

type BrandLogoProps = {
  size?: "compact" | "large";
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
  },
};

export default function BrandLogo({ size = "compact", onPress }: BrandLogoProps) {
  const s = SIZES[size];
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper {...wrapperProps} style={styles.container}>
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
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
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
