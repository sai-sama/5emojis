import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { addPhoto, removePhoto } from "../../lib/profile-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function PhotosScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const handleAdd = async () => {
    if (!session?.user) return;
    if (profile.photos.length >= 5) {
      Alert.alert("Max photos", "You can have up to 5 photos.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      const position = profile.photos.length + 1;
      const { error } = await addPhoto(session.user.id, result.assets[0].uri, position, position === 1);
      setSaving(false);
      if (error) {
        Alert.alert("Upload failed", error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refresh();
      }
    }
  };

  const handleRemove = (photoId: string, photoUrl: string) => {
    if (profile.photos.length <= 1) {
      Alert.alert("Can't remove", "You need at least one photo.");
      return;
    }
    Alert.alert("Remove photo?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          await removePhoto(photoId, photoUrl);
          setSaving(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          refresh();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photos</Text>
        <View style={{ width: 32 }}>
          {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {profile.photos.map((photo, i) => (
          <View key={photo.id} style={styles.photoCard}>
            <Image source={{ uri: photo.url }} style={styles.photoImage} />
            {i === 0 && (
              <View style={styles.primaryLabel}>
                <Text style={styles.primaryLabelText}>Main</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(photo.id, photo.url)}
            >
              <Ionicons name="close" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}

        {profile.photos.length < 5 && (
          <TouchableOpacity style={styles.addSlot} onPress={handleAdd}>
            <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },
  photoCard: {
    width: "47%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  primaryLabel: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  primaryLabelText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: "#FFF",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addSlot: {
    width: "47%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
});
