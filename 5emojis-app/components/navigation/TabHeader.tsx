import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../lib/constants";
import BrandLogo from "../BrandLogo";

export default function TabHeader() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from("profile_photos")
      .select("url")
      .eq("user_id", session.user.id)
      .eq("is_primary", true)
      .single()
      .then(({ data }) => {
        if (data?.url) setAvatarUri(data.url);
      });
  }, [session?.user?.id]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <BrandLogo size="compact" />
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
