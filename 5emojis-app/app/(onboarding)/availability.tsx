import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import { AVAILABILITY_SLOTS, MAX_AVAILABILITY } from "../../lib/profile-constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function AvailabilityScreen() {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.availability);

  const toggle = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value === "anytime") {
      // "Anytime!" toggles exclusively — deselects all others
      setSelected(selected.includes("anytime") ? [] : ["anytime"]);
    } else if (selected.includes(value)) {
      setSelected(selected.filter((s) => s !== value));
    } else {
      // Selecting a specific slot deselects "anytime"
      const without = selected.filter((s) => s !== "anytime");
      if (without.length < MAX_AVAILABILITY) {
        setSelected([...without, value]);
      }
    }
  };

  const canContinue = selected.length >= 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          When are you free?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 28 }}
        >
          Pick up to 3 — helps match you with similar schedules
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.textSecondary, letterSpacing: 0.5 }}>
              🗓️  AVAILABILITY
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: selected.length >= 1 ? COLORS.primary : "#B2BEC3" }}>
              {selected.length}/{MAX_AVAILABILITY}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {AVAILABILITY_SLOTS.map(({ label, value, icon }) => {
              const sel = selected.includes(value);
              const isAnytime = selected.includes("anytime");
              const full = !sel && (selected.length >= MAX_AVAILABILITY || (isAnytime && value !== "anytime"));
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => toggle(value)}
                  disabled={full}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 20,
                    backgroundColor: sel ? COLORS.primary : COLORS.surface,
                    borderWidth: 1.5,
                    borderColor: sel ? COLORS.primary : COLORS.border,
                    opacity: full ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text>
                  <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: sel ? "#FFF" : "#2D3436" }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <OnboardingButton
          disabled={!canContinue}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ availability: selected });
            router.push("/(onboarding)/personality");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
