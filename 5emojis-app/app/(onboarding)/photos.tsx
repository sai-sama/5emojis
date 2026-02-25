import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<string[]>([]);

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView className="flex-1 px-8 pt-8" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-3xl font-bold text-text mb-2">
          Add your photos
        </Text>
        <Text className="text-text-secondary mb-8">
          Up to 5 photos. Your first photo is your main one — make sure it clearly shows your face!
        </Text>

        <View className="flex-row flex-wrap gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <TouchableOpacity
              key={i}
              className="w-[30%] aspect-[3/4] bg-surface border-2 border-dashed border-gray-300 rounded-xl items-center justify-center overflow-hidden"
              onPress={() => pickPhoto(i)}
            >
              {photos[i] ? (
                <View className="w-full h-full">
                  <Image
                    source={{ uri: photos[i] }}
                    className="w-full h-full rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 items-center justify-center"
                    onPress={() => removePhoto(i)}
                  >
                    <Text className="text-white text-xs">✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text className="text-3xl text-gray-400">
                  {i === 0 ? "📸" : "+"}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {photos.length === 0 && (
          <View className="bg-purple-50 rounded-xl p-4 mb-4">
            <Text className="text-primary font-semibold mb-1">Photo tips</Text>
            <Text className="text-text-secondary text-sm">
              • Clear face photo required for your main pic{"\n"}
              • No group shots for photo #1{"\n"}
              • Show your personality!
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-8 pb-4">
        <TouchableOpacity
          className={`rounded-xl py-4 ${photos.length > 0 ? "bg-primary" : "bg-gray-300"}`}
          disabled={photos.length === 0}
          onPress={() => {
            router.push("/(onboarding)/emojis");
          }}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
