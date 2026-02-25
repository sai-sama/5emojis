import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DOBScreen() {
  const [dob, setDob] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="flex-1 px-8 pt-8">
        <Text className="text-3xl font-bold text-text mb-2">
          When's your birthday?
        </Text>
        <Text className="text-text-secondary mb-8">
          We'll show your age, not your birthday.
        </Text>

        <TextInput
          className="bg-surface border border-gray-200 rounded-xl px-4 py-4 text-lg text-text"
          placeholder="MM/DD/YYYY"
          value={dob}
          onChangeText={setDob}
          keyboardType="number-pad"
          autoFocus
        />

        <View className="flex-1" />

        <TouchableOpacity
          className={`rounded-xl py-4 mb-4 ${dob.trim() ? "bg-primary" : "bg-gray-300"}`}
          disabled={!dob.trim()}
          onPress={() => {
            // TODO: Validate age (18+), save to state
            router.push("/(onboarding)/photos");
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
