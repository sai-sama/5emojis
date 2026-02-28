import { useState } from "react";
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function NameScreen() {
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          👋  What's your name?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          This is how you'll appear to others.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor="#B2BEC3"
            autoFocus
            autoCapitalize="words"
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1.5,
              borderColor: name.trim() ? COLORS.primary : COLORS.border,
            }}
          />

          {name.trim().length > 0 && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 16,
              gap: 8,
            }}>
              <Text style={{ fontSize: 24 }}>✨</Text>
              <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                Nice to meet you, <Text style={{ fontFamily: fonts.bodyBold, color: COLORS.primary }}>{name.trim()}</Text>!
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <OnboardingButton
          disabled={!name.trim()}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ name: name.trim() });
            router.push("/(onboarding)/dob");
          }}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
