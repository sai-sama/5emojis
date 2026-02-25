import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NameScreen() {
  const [name, setName] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="flex-1 px-8 pt-8">
        <Text className="text-3xl font-bold text-text mb-2">
          What's your name?
        </Text>
        <Text className="text-text-secondary mb-8">
          This is how you'll appear to others.
        </Text>

        <TextInput
          className="bg-surface border border-gray-200 rounded-xl px-4 py-4 text-lg text-text"
          placeholder="Your first name"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
        />

        <View className="flex-1" />

        <TouchableOpacity
          className={`rounded-xl py-4 mb-4 ${name.trim() ? "bg-primary" : "bg-gray-300"}`}
          disabled={!name.trim()}
          onPress={() => {
            // TODO: Save name to state/context
            router.push("/(onboarding)/dob");
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
