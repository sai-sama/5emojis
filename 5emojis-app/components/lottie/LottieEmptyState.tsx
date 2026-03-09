import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

type LottieEmptyStateProps = {
  title: string;
  subtitle: string;
  size?: number;
  children?: React.ReactNode;
};

export default function LottieEmptyState({
  title,
  subtitle,
  size = 120,
  children,
}: LottieEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name="search-outline" size={size * 0.4} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    backgroundColor: COLORS.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 22,
  },
});
