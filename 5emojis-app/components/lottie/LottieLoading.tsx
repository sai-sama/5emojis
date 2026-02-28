import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

type LottieLoadingProps = {
  message?: string;
  size?: number;
};

export default function LottieLoading({
  message = "Loading...",
  size = 150,
}: LottieLoadingProps) {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../assets/animations/loading-bouncing.json")}
        autoPlay
        loop
        speed={1}
        style={{ width: size, height: size }}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  message: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
  },
});
