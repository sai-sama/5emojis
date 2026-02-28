import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type Props = {
  icon: string;
  title: string;
  summary: string;
  onPress: () => void;
};

export default function ProfileSectionRow({ icon, title, summary, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  summary: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: "300",
    marginLeft: 8,
  },
});
