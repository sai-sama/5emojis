import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS, GENDERS, type GenderValue } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function GenderScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<GenderValue>(data.gender);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          What's your gender?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          This helps us personalize your experience
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{ gap: 12 }}>
          {GENDERS.map((gender) => {
            const isSelected = selected === gender.value;
            return (
              <TouchableOpacity
                key={gender.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(gender.value);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? gender.surface : COLORS.surface,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? gender.color : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 32, marginRight: 16 }}>{gender.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontFamily: fonts.bodySemiBold,
                    color: isSelected ? gender.color : COLORS.text,
                  }}>
                    {gender.label}
                  </Text>
                </View>
                {isSelected && (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: gender.color,
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
            update({ gender: selected });
            router.push("/(onboarding)/photos");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
