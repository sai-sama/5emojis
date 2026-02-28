import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, INTENTS, type IntentValue } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

type Props = {
  selected: IntentValue | null; // null = show everyone (same as "both")
  onSelect: (value: IntentValue | null) => void;
};

export default function IntentFilter({ selected, onSelect }: Props) {
  const options = [
    { value: null as IntentValue | null, label: "Everyone", emoji: "✨" },
    { value: "friends" as IntentValue | null, label: "Friends", emoji: "🤝" },
    { value: "dating" as IntentValue | null, label: "Dating", emoji: "💕" },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        const intentInfo = opt.value
          ? INTENTS.find((i) => i.value === opt.value)
          : null;
        const activeColor = intentInfo?.color ?? COLORS.primary;

        return (
          <Pressable
            key={opt.label}
            onPress={() => {
              if (!isActive) {
                Haptics.selectionAsync();
                onSelect(opt.value);
              }
            }}
            style={[
              styles.chip,
              isActive && { backgroundColor: activeColor, borderColor: activeColor },
            ]}
          >
            <Text style={styles.chipEmoji}>{opt.emoji}</Text>
            <Text
              style={[
                styles.chipLabel,
                isActive && { color: "#FFF" },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
