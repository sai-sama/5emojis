import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS } from "../lib/constants";
import { fonts } from "../lib/fonts";
import type { WellnessTip } from "../lib/wellness-tips";

interface Props {
  visible: boolean;
  tip: WellnessTip | null;
  onDismiss: () => void;
}

export default function WellnessTipModal({ visible, tip, onDismiss }: Props) {
  if (!tip) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          entering={ZoomIn.springify().damping(18).stiffness(200).delay(100)}
          style={styles.card}
        >
          <Text style={styles.emoji}>{tip.emoji}</Text>
          <Text style={styles.label}>Tip of the Day</Text>
          <Text style={styles.tipText}>{tip.tip}</Text>

          <Pressable style={styles.button} onPress={handleDismiss}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.highlightSurface,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 17,
    fontFamily: fonts.body,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
});
