import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type Props = {
  label: string;
  icon: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function Chip({ label, icon, selected, disabled, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && !selected && styles.chipDisabled,
      ]}
    >
      <Text style={{ fontSize: 13, marginRight: 3 }}>{icon}</Text>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },
});
