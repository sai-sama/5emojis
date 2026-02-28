import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type Props = {
  title: string;
  emoji: string;
  action?: string;
  onAction?: () => void;
};

export default function SectionHeader({ title, emoji, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={12}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
    flex: 1,
  },
  action: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
});
