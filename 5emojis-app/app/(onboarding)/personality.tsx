import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import { PERSONALITY_TYPES } from "../../lib/profile-constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function PersonalityScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState(data.personalityType);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          What's your vibe?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          No wrong answer — just helps find your people
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{ gap: 12 }}>
          {PERSONALITY_TYPES.map((type) => {
            const isSelected = selected === type.value;
            return (
              <TouchableOpacity
                key={type.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelected(type.value);
                }}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? type.surface : COLORS.surface,
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: isSelected ? type.color : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 32, marginRight: 16 }}>{type.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontFamily: fonts.bodySemiBold,
                    color: isSelected ? type.color : COLORS.text,
                  }}>
                    {type.label}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: fonts.body,
                    color: COLORS.textSecondary,
                    marginTop: 2,
                  }}>
                    {type.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: type.color,
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
          disabled={!selected}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ personalityType: selected });
            router.push("/(onboarding)/age-pref");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
