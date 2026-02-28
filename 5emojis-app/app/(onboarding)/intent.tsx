import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS, INTENTS, type IntentValue } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function IntentScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<IntentValue>(data.intent);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          What are you looking for?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          You can always change this later.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{ gap: 12 }}>
          {INTENTS.map((intent) => {
            const isSelected = selected === intent.value;
            return (
              <TouchableOpacity
                key={intent.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(intent.value);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? intent.surface : COLORS.surface,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? intent.color : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 32, marginRight: 16 }}>{intent.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontFamily: fonts.bodySemiBold,
                    color: isSelected ? intent.color : COLORS.text,
                  }}>
                    {intent.label}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.body,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}>
                    {intent.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: intent.color,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Text style={{ color: "#FFF", fontSize: 14, fontFamily: fonts.bodyBold }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <OnboardingButton
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ intent: selected });
            router.push("/(onboarding)/photos");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
