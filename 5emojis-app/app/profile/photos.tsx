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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import { addPhoto, removePhoto, setMainPhoto, reorderPhotos } from "../../lib/profile-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function PhotosScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  if (!profile) return null;

  const sortedPhotos = [...profile.photos].sort(
    (a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.position - b.position
  );

  const handlePhotoTap = async (photo: typeof sortedPhotos[0]) => {
    // If in swap mode, perform the swap
    if (selectedSwapId && selectedSwapId !== photo.id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photoA = sortedPhotos.find((p) => p.id === selectedSwapId);
      const photoB = photo;
      if (!photoA) return;

      setSaving(true);
      // Swap positions
      const { error } = await reorderPhotos([
        { id: photoA.id, position: photoB.position },
        { id: photoB.id, position: photoA.position },
      ]);
      // If one becomes primary position, update is_primary
      if (!error && (photoA.is_primary || photoB.is_primary)) {
        if (photoA.is_primary && session?.user) {
          await setMainPhoto(session.user.id, photoB.id);
        } else if (photoB.is_primary && session?.user) {
          await setMainPhoto(session.user.id, photoA.id);
        }
      }
      setSaving(false);
      setSelectedSwapId(null);
      if (error) {
        Alert.alert("Error", error);
      } else {
        await refresh();
      }
      return;
    }
    // Clear selection if tapping same photo
    if (selectedSwapId === photo.id) {
      setSelectedSwapId(null);
      return;
    }
  };

  const handleLongPress = (photo: typeof sortedPhotos[0]) => {
    if (sortedPhotos.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSwapId(photo.id);
  };

  const handleAdd = async () => {
    if (!session?.user) return;
    if (profile.photos.length >= 5) {
      Alert.alert("Max photos", "You can have up to 5 photos.");
      return;
    }
    setSelectedSwapId(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSaving(true);
      const maxPos = profile.photos.length > 0
        ? Math.max(...profile.photos.map((p: any) => p.position))
        : 0;
      const position = maxPos + 1;
      const { error } = await addPhoto(session.user.id, result.assets[0].uri, position, profile.photos.length === 0);
      setSaving(false);
      if (error) {
        Alert.alert("Upload failed", error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refresh();
      }
    }
  };

  const handleRemove = (photoId: string, photoUrl: string) => {
    if (profile.photos.length <= 1) {
      Alert.alert("Can't remove", "You need at least one photo.");
      return;
    }
    setSelectedSwapId(null);
    Alert.alert("Remove photo?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          await removePhoto(photoId, photoUrl, session?.user?.id);
          setSaving(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refresh();
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

      {/* Reorder hint */}
      {selectedSwapId && (
        <View style={styles.swapBanner}>
          <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
          <Text style={styles.swapBannerText}>Tap another photo to swap</Text>
          <TouchableOpacity onPress={() => setSelectedSwapId(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Permission denied recovery */}
      {permissionDenied && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={18} color={COLORS.accent} />
          <Text style={styles.permissionText}>Photo access denied</Text>
          <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {sortedPhotos.map((photo) => {
          const isSelected = selectedSwapId === photo.id;
          const isSwapTarget = selectedSwapId !== null && selectedSwapId !== photo.id;
          return (
            <TouchableOpacity
              key={photo.id}
              style={[
                styles.photoCard,
                isSelected && styles.photoCardSelected,
                isSwapTarget && styles.photoCardSwapTarget,
              ]}
              activeOpacity={0.8}
              onPress={() => handlePhotoTap(photo)}
              onLongPress={() => handleLongPress(photo)}
              delayLongPress={300}
            >
              <Image source={{ uri: photo.url }} style={styles.photoImage} />
              {photo.is_primary && (
                <View style={styles.primaryLabel}>
                  <Text style={styles.primaryLabelText}>Main</Text>
                </View>
              )}
              {!photo.is_primary && !selectedSwapId && (
                <View style={styles.setMainHint}>
                  <Text style={styles.setMainHintText}>Hold to reorder</Text>
                </View>
              )}
              {isSelected && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="move" size={28} color="#FFF" />
                </View>
              )}
              {!isSelected && (
                <TouchableOpacity
                  testID={`remove-photo-${photo.position}`}
                  style={styles.removeBtn}
                  onPress={() => handleRemove(photo.id, photo.url)}
                >
                  <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        {profile.photos.length < 5 && (
          <TouchableOpacity style={styles.addSlot} onPress={handleAdd}>
            <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
            <Text style={styles.addText}>Add Photo</Text>
          </TouchableOpacity>
        )}

        {sortedPhotos.length >= 2 && !selectedSwapId && (
          <Text style={styles.reorderHint}>Hold a photo to reorder</Text>
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
  setMainHint: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  setMainHintText: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
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
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(251,191,36,0.2)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCardSelected: {
    borderWidth: 3,
    borderColor: COLORS.highlight,
    transform: [{ scale: 0.95 }],
  },
  photoCardSwapTarget: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  swapBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  swapBannerText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: COLORS.passSurface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  permissionText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: "#FFF",
  },
  reorderHint: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginTop: 4,
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
