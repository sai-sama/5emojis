import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Linking, Dimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "../../lib/onboarding-context";
import { logError } from "../../lib/error-logger";
import { detectFaceInPhoto } from "../../lib/face-detection";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function PhotosScreen() {
  const { data, update } = useOnboarding();
  const [photos, setPhotos] = useState<string[]>(data.photos);
  const [checkingFace, setCheckingFace] = useState(false);
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const pickPhoto = async (index: number) => {
    // If a photo is selected for swapping and user taps another filled slot, swap
    if (selectedSwapIndex !== null && selectedSwapIndex !== index && index < photos.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newPhotos = [...photos];
      const temp = newPhotos[selectedSwapIndex];
      newPhotos[selectedSwapIndex] = newPhotos[index];
      newPhotos[index] = temp;

      // Face detection if swapping to/from position 0
      if (selectedSwapIndex === 0 || index === 0) {
        const mainPhotoUri = newPhotos[0];
        setCheckingFace(true);
        const faceResult = await detectFaceInPhoto(mainPhotoUri);
        setCheckingFace(false);
        if (!faceResult.hasFace) {
          Alert.alert(
            "No face detected",
            "Your main photo (position 1) needs to clearly show your face. Swap cancelled."
          );
          setSelectedSwapIndex(null);
          return;
        }
      }

      setPhotos(newPhotos);
      setSelectedSwapIndex(null);
      return;
    }

    // Clear swap selection if tapping the same photo or empty slot
    if (selectedSwapIndex !== null) {
      setSelectedSwapIndex(null);
    }

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
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Copy to persistent directory so the URI survives across screens.
      // iOS can clean up ImagePicker temp URIs before onboarding finishes.
      let persistentUri = result.assets[0].uri;
      try {
        const dir = `${FileSystem.documentDirectory}onboarding-photos/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const dest = `${dir}photo_${index}_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
        persistentUri = dest;
      } catch (e: any) {
        // If copy fails, fall back to original URI
        console.warn("Failed to persist photo, using temp URI:", e);
        logError(e, { screen: "PhotosScreen", context: "persist_photo_to_documents" });
      }

      // Face detection for primary photo (index 0) — give immediate feedback
      if (index === 0) {
        setCheckingFace(true);
        const faceResult = await detectFaceInPhoto(persistentUri);
        setCheckingFace(false);
        if (!faceResult.hasFace) {
          Alert.alert(
            "No face detected",
            faceResult.error || "Your main photo needs to clearly show your face. Try a different photo!"
          );
          return;
        }
      }

      const newPhotos = [...photos];
      if (index < photos.length) {
        newPhotos[index] = persistentUri;
      } else {
        newPhotos.push(persistentUri);
      }
      setPhotos(newPhotos);
    }
  };

  const handleLongPress = (index: number) => {
    if (index >= photos.length || photos.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSwapIndex(index);
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSwapIndex(null);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const slotEmojis = ["📸", "😄", "🎉", "🌟", "💫"];
  const GRID_GAP = 12;
  const GRID_PADDING = 32;
  const COLUMNS = 3;
  const screenWidth = Dimensions.get("window").width;
  const slotWidth = (screenWidth - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 110, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          📷  Add your photos
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 24 }}
        >
          Up to 5 photos. Your first one is your main pic — make sure it clearly shows your face!
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {/* Reorder hint */}
          {photos.length >= 2 && selectedSwapIndex === null && (
            <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textMuted, marginBottom: 8, textAlign: "center" }}>
              Hold a photo to reorder
            </Text>
          )}
          {selectedSwapIndex !== null && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 8,
              backgroundColor: COLORS.primarySoft,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
              alignSelf: "center",
            }}>
              <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
              <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: COLORS.primary }}>
                Tap another photo to swap
              </Text>
              <TouchableOpacity onPress={() => setSelectedSwapIndex(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const isSelected = selectedSwapIndex === i;
              const isSwapTarget = selectedSwapIndex !== null && selectedSwapIndex !== i && i < photos.length;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => pickPhoto(i)}
                  onLongPress={() => handleLongPress(i)}
                  delayLongPress={300}
                  style={{
                    width: slotWidth,
                    aspectRatio: 3 / 4,
                    backgroundColor: photos[i] ? COLORS.primarySurface : COLORS.surface,
                    borderWidth: isSelected ? 3 : 2,
                    borderStyle: photos[i] ? "solid" : "dashed",
                    borderColor: isSelected
                      ? COLORS.highlight
                      : isSwapTarget
                        ? COLORS.primaryLight
                        : photos[i]
                          ? COLORS.primary
                          : COLORS.disabled,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    opacity: isSelected ? 0.85 : 1,
                    transform: [{ scale: isSelected ? 0.95 : 1 }],
                  }}
                >
                  {photos[i] ? (
                    <View style={{ width: "100%", height: "100%" }}>
                      <Image
                        source={{ uri: photos[i] }}
                        style={{ width: "100%", height: "100%", borderRadius: 14 }}
                        resizeMode="cover"
                      />
                      {/* Position badge */}
                      {i === 0 && (
                        <View style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          backgroundColor: COLORS.primary,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 10, color: "#FFF", fontFamily: fonts.bodySemiBold }}>MAIN</Text>
                        </View>
                      )}
                      {/* Swap indicator */}
                      {isSelected && (
                        <View style={{
                          position: "absolute",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: "rgba(251,191,36,0.15)",
                          borderRadius: 14,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons name="move" size={28} color="#FFF" />
                        </View>
                      )}
                      {isSwapTarget && (
                        <View style={{
                          position: "absolute",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: "rgba(124,58,237,0.1)",
                          borderRadius: 14,
                        }} />
                      )}
                      {!isSelected && (
                        <TouchableOpacity
                          onPress={() => removePhoto(i)}
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            borderRadius: 12,
                            width: 24,
                            height: 24,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={14} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Text style={{ fontSize: 28, lineHeight: 36, textAlign: "center" }}>{slotEmojis[i]}</Text>
                      {i === 0 && (
                        <Text style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: fonts.bodySemiBold, textAlign: "center" }}>MAIN</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Permission denied recovery */}
          {permissionDenied && (
            <View style={{
              backgroundColor: COLORS.passSurface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: COLORS.accent,
              flexDirection: "row",
              gap: 10,
              marginBottom: 16,
            }}>
              <Ionicons name="warning" size={20} color={COLORS.accent} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: COLORS.text, marginBottom: 4 }}>
                  Photo access denied
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 }}>
                  5Emojis needs access to your photo library to add profile photos. Please enable it in Settings.
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openSettings()}
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: "#FFF" }}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Photo Guidelines — always visible */}
          <View style={{
            backgroundColor: COLORS.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            gap: 10,
          }}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: COLORS.text, marginBottom: 6 }}>
                Photo Guidelines
              </Text>
              {[
                "Your main photo must clearly show your face",
                "No sunglasses, masks, or heavy filters on photo #1",
                "No group photos for your main pic",
                "Show your personality! Hobbies, travel, pets are great",
                "Keep it appropriate — photos are moderated",
              ].map((tip, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.body,
                    color: COLORS.textSecondary,
                    lineHeight: 18,
                    marginBottom: idx < 4 ? 2 : 0,
                  }}
                >
                  {"\u2022  "}{tip}
                </Text>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={{ paddingHorizontal: 32, paddingBottom: 0, paddingTop: 8 }}>
        <OnboardingButton
          disabled={photos.length === 0}
          label={photos.length > 0 ? "Continue" : "Add at least 1 photo"}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ photos });
            router.push("/(onboarding)/emojis");
          }}
        />
      </View>

      {/* Face detection loading overlay */}
      {checkingFace && (
        <View style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <View style={{
            backgroundColor: "#FFF",
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            gap: 12,
          }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ fontSize: 15, fontFamily: fonts.bodySemiBold, color: COLORS.text }}>
              Checking for face...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
