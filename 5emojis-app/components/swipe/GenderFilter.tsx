import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { COLORS, GENDERS, type GenderValue } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

type Props = {
  selected: GenderValue | null; // null = show everyone
  onSelect: (value: GenderValue | null) => void;
};

export default function GenderFilter({ selected, onSelect }: Props) {
  const options: { value: GenderValue | null; label: string; emoji: string }[] = [
    { value: null, label: "All", emoji: "✨" },
    ...GENDERS.map((g) => ({ value: g.value as GenderValue | null, label: g.label, emoji: g.emoji })),
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = selected === opt.value;
        const genderInfo = opt.value
          ? GENDERS.find((g) => g.value === opt.value)
          : null;
        const activeColor = genderInfo?.color ?? COLORS.primary;

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
