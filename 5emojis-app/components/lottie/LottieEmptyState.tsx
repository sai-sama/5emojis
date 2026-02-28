import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
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
  size = 220,
  children,
}: LottieEmptyStateProps) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/empty-box.json")}
        autoPlay
        loop
        speed={0.8}
        style={{ width: size, height: size }}
      />
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
