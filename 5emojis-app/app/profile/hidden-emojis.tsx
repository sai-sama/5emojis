import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { updateProfileFields } from "../../lib/profile-service";
import EmojiPicker from "../../components/EmojiPicker";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

const MAX_HIDDEN_EMOJIS = 5;

export default function HiddenEmojisScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [selected, setSelected] = useState<string[]>(
    profile?.profile.hidden_emojis ?? []
  );
  const [saving, setSaving] = useState(false);

  const hasChanges =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify([...(profile?.profile.hidden_emojis ?? [])].sort());

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);
    const { error } = await updateProfileFields(session.user.id, {
      hidden_emojis: selected,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Error", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
      router.back();
    }
  };

  const handleToggle = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selected.includes(emoji)) {
      setSelected(selected.filter((e) => e !== emoji));
    } else if (selected.length < MAX_HIDDEN_EMOJIS) {
      setSelected([...selected, emoji]);
    }
  };

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hidden Emojis</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          <Text
            style={[
              styles.saveText,
              (!hasChanges || saving) && { opacity: 0.4 },
            ]}
          >
            {saving ? "..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons
          name="eye-off-outline"
          size={18}
          color={COLORS.primary}
          style={{ marginRight: 8, marginTop: 1 }}
        />
        <Text style={styles.infoText}>
          Pick up to 5 emojis you don't vibe with. Profiles with any of these
          won't appear in your discovery feed.
        </Text>
      </View>

      {/* Selected hidden emojis */}
      {selected.length > 0 && (
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedLabel}>
              HIDING {selected.length}/{MAX_HIDDEN_EMOJIS}
            </Text>
            <Pressable onPress={handleClearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
          </View>
          <View style={styles.selectedRow}>
            {selected.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleToggle(emoji)}
                style={styles.selectedChip}
              >
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                <View style={styles.removeIcon}>
                  <Ionicons name="close" size={10} color="#FFF" />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Emoji picker */}
      <View style={{ flex: 1 }}>
        <EmojiPicker
          selected={selected}
          onToggle={handleToggle}
          maxSelection={MAX_HIDDEN_EMOJIS}
          hideQuickStart
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  saveText: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.text,
    lineHeight: 18,
  },
  selectedSection: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.error,
  },
  selectedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  selectedChip: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
  removeIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
});
