import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function LocationScreen() {
  const [city, setCity] = useState("");
  const [isNewToCity, setIsNewToCity] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="flex-1 px-8 pt-8">
        <Text className="text-3xl font-bold text-text mb-2">
          Where are you?
        </Text>
        <Text className="text-text-secondary mb-8">
          We'll show you people nearby.
        </Text>

        <TextInput
          className="bg-surface border border-gray-200 rounded-xl px-4 py-4 text-lg text-text mb-6"
          placeholder="City or ZIP code"
          value={city}
          onChangeText={setCity}
          autoFocus
        />

        <View className="flex-row items-center justify-between bg-surface rounded-xl p-4 mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-text font-semibold">New to this city?</Text>
            <Text className="text-text-secondary text-sm">
              Get a badge so locals know you're looking to meet people
            </Text>
          </View>
          <Switch
            value={isNewToCity}
            onValueChange={(value) => {
              setIsNewToCity(value);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            trackColor={{ false: "#E2E8F0", true: "#6C5CE7" }}
          />
        </View>

        <View className="flex-1" />

        <TouchableOpacity
          className={`rounded-xl py-4 mb-4 ${city.trim() ? "bg-primary" : "bg-gray-300"}`}
          disabled={!city.trim()}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // TODO: Geocode city, save profile to Supabase, navigate to tabs
            router.replace("/(tabs)");
          }}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Let's go!
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
