import { View, StyleSheet } from "react-native";
import { usePathname } from "expo-router";
import { COLORS } from "../lib/constants";

const STEPS = ["name", "dob", "gender", "photos", "emojis", "details", "availability", "personality", "age-pref", "location"];

export default function OnboardingProgress() {
  const pathname = usePathname();
  const currentScreen = pathname.split("/").pop() || "";
  const currentIndex = STEPS.indexOf(currentScreen);

  return (
    <View style={styles.container}>
      {STEPS.map((step, i) => (
        <View
          key={step}
          style={[
            styles.dot,
            i <= currentIndex ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  active: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  inactive: {
    width: 6,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
  },
});
