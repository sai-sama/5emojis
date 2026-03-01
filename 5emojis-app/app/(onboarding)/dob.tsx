import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { getZodiacSign } from "../../lib/zodiac";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

function calculateAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DOBScreen() {
  const { data, update } = useOnboarding();

  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 21);

  const [date, setDate] = useState(data.dob || defaultDate);
  const [hasSelected, setHasSelected] = useState(!!data.dob);
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  const age = useMemo(() => calculateAge(date), [date]);
  const zodiac = useMemo(() => getZodiacSign(date.toISOString()), [date]);
  const isOldEnough = age >= 18;

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      if (!hasSelected) setHasSelected(true);
      Haptics.selectionAsync();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 80 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          🎂  When's your birthday?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          We'll show your age, not your birthday.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {Platform.OS === "ios" && (
            <View style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              paddingVertical: 8,
              marginBottom: 24,
              borderWidth: 1.5,
              borderColor: hasSelected ? COLORS.primary : COLORS.border,
            }}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                minimumDate={new Date(1940, 0, 1)}
                onChange={onDateChange}
                style={{ height: 150 }}
              />
            </View>
          )}

          {Platform.OS === "android" && (
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 20,
                marginBottom: 24,
                borderWidth: 1.5,
                borderColor: hasSelected ? COLORS.primary : COLORS.border,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontFamily: hasSelected ? fonts.bodySemiBold : fonts.body,
                  color: hasSelected ? COLORS.text : "#B2BEC3",
                }}>
                  {hasSelected ? formatDate(date) : "Tap to select your birthday"}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: fonts.bodySemiBold }}>
                {hasSelected ? "Change" : "Select"}
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === "android" && showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={new Date(1940, 0, 1)}
              onChange={onDateChange}
            />
          )}

          {hasSelected && (
            <View style={{
              backgroundColor: COLORS.primarySurface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.primaryBorder,
              alignItems: "center",
              gap: 8,
            }}>
              <Text style={{ fontSize: 48 }}>{zodiac.emoji}</Text>
              <Text style={{ fontSize: 20, fontFamily: fonts.headingBold, color: COLORS.primary }}>
                {zodiac.sign}
              </Text>
              <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                {age} years old
              </Text>
              {!isOldEnough && (
                <View style={{
                  backgroundColor: COLORS.passSurface,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  marginTop: 4,
                }}>
                  <Text style={{ fontSize: 13, color: COLORS.accent, fontFamily: fonts.bodySemiBold }}>
                    ⚠️  You must be 18+ to use 5Emojis
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <OnboardingButton
          disabled={!hasSelected || !isOldEnough}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ dob: date });
            router.push("/(onboarding)/gender");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
