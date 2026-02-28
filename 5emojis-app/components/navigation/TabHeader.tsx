import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

type TabHeaderProps = {
  title: string;
};

export default function TabHeader({ title }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  // TODO: load user's primary photo from profile — for now use placeholder
  const avatarUri: string | null = null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => router.push("/profile")}
        activeOpacity={0.7}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 16 }}>👤</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: COLORS.text,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0EDE8",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
});
