import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import EmojiBackground, { PHOTO_EMOJIS } from "../../components/EmojiBackground";

export default function PhotosScreen() {
  const { data, update } = useOnboarding();
  const [photos, setPhotos] = useState<string[]>(data.photos);

  const pickPhoto = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPhotos = [...photos];
      if (index < photos.length) {
        newPhotos[index] = result.assets[0].uri;
      } else {
        newPhotos.push(result.assets[0].uri);
      }
      setPhotos(newPhotos);
    }
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const slotEmojis = ["📸", "😄", "🎉", "🌟", "💫"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }} edges={["bottom"]}>
      <EmojiBackground emojis={PHOTO_EMOJIS} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 28, fontFamily: fonts.heading, color: "#2D3436" }}>
          📷  Add your photos
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72", marginTop: 4, marginBottom: 24 }}>
          Up to 5 photos. Your first one is your main pic — make sure it clearly shows your face!
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => pickPhoto(i)}
              style={{
                width: "30%",
                aspectRatio: 3 / 4,
                backgroundColor: photos[i] ? "#F5F0FF" : "#FFF",
                borderWidth: 2,
                borderStyle: photos[i] ? "solid" : "dashed",
                borderColor: photos[i] ? "#7C3AED" : "#D1D5DB",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {photos[i] ? (
                <View style={{ width: "100%", height: "100%" }}>
                  <Image
                    source={{ uri: photos[i] }}
                    style={{ width: "100%", height: "100%", borderRadius: 14 }}
                    resizeMode="cover"
                  />
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
                    <Text style={{ color: "#FFF", fontSize: 12, fontFamily: fonts.bodyBold }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 28 }}>{slotEmojis[i]}</Text>
                  {i === 0 && (
                    <Text style={{ fontSize: 10, color: "#636E72", fontFamily: fonts.bodySemiBold }}>MAIN</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {photos.length === 0 && (
          <View style={{
            backgroundColor: "#F5F0FF",
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E4DAFF",
          }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: "#7C3AED", marginBottom: 6 }}>
              💡 Photo tips
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.body, color: "#636E72", lineHeight: 20 }}>
              {"• Clear face photo for pic #1 — no sunglasses!\n• No group shots for your main pic\n• Show your personality — hobbies, travel, pets 🐶"}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 32, paddingBottom: 16, paddingTop: 8, backgroundColor: "#FFF8F0" }}>
        <TouchableOpacity
          disabled={photos.length === 0}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ photos });
            router.push("/(onboarding)/emojis");
          }}
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            backgroundColor: photos.length > 0 ? "#7C3AED" : "#D1D5DB",
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
            {photos.length > 0 ? "Continue" : "Add at least 1 photo"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
