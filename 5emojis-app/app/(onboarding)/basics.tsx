import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { useAuth } from "../../lib/auth-context";
import { getZodiacSign } from "../../lib/zodiac";
import { fonts } from "../../lib/fonts";
import { COLORS, GENDERS, type GenderValue } from "../../lib/constants";
import OnboardingButton from "../../components/OnboardingButton";

function calculateAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export default function BasicsScreen() {
  const { data, update } = useOnboarding();
  const { signOut } = useAuth();

  // Name
  const [name, setName] = useState(data.name);

  // DOB
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 21);
  const [date, setDate] = useState(data.dob || defaultDate);
  const [hasSelectedDob, setHasSelectedDob] = useState(!!data.dob);
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  const age = useMemo(() => calculateAge(date), [date]);
  const zodiac = useMemo(() => getZodiacSign(date.toISOString()), [date]);
  const isOldEnough = age >= 18;

  // Gender
  const [gender, setGender] = useState<GenderValue>(data.gender);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      if (!hasSelectedDob) setHasSelectedDob(true);
      Haptics.selectionAsync();
    }
  };

  const canContinue = name.trim() && hasSelectedDob && isOldEnough;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 110, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.Text
            entering={FadeInDown.duration(500).delay(100)}
            style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
          >
            Let's get started
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(500).delay(200)}
            style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
          >
            Just the basics — takes 30 seconds
          </Animated.Text>

          {/* ─── Name ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.bodyBold,
              color: COLORS.textSecondary,
              letterSpacing: 0.5,
              marginBottom: 8,
            }}>
              👋  YOUR NAME
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              placeholderTextColor="#B2BEC3"
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
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
                <Text style={{ fontSize: 16 }}>✨</Text>
                <Text style={{ fontSize: 13, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                  Nice to meet you, <Text style={{ fontFamily: fonts.bodyBold, color: COLORS.primary }}>{name.trim()}</Text>!
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ─── Divider ───────────────────────────────────────── */}
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 24 }} />

          {/* ─── Birthday ──────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)}>
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.bodyBold,
              color: COLORS.textSecondary,
              letterSpacing: 0.5,
              marginBottom: 8,
            }}>
              🎂  BIRTHDAY
            </Text>
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.body,
              color: COLORS.textMuted,
              marginBottom: 12,
            }}>
              We'll show your age, not your birthday
            </Text>

            {Platform.OS === "ios" && (
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                paddingVertical: 4,
                marginBottom: 12,
                borderWidth: 1.5,
                borderColor: hasSelectedDob ? COLORS.primary : COLORS.border,
              }}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1940, 0, 1)}
                  onChange={onDateChange}
                  style={{ height: 120 }}
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
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: hasSelectedDob ? COLORS.primary : COLORS.border,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>📅</Text>
                <Text style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: hasSelectedDob ? fonts.bodySemiBold : fonts.body,
                  color: hasSelectedDob ? COLORS.text : "#B2BEC3",
                }}>
                  {hasSelectedDob
                    ? `${date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
                    : "Tap to select your birthday"}
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

            {hasSelectedDob && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                backgroundColor: COLORS.primarySurface,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: COLORS.primaryBorder,
              }}>
                <Text style={{ fontSize: 32 }}>{zodiac.emoji}</Text>
                <View>
                  <Text style={{ fontSize: 16, fontFamily: fonts.headingBold, color: COLORS.primary }}>
                    {zodiac.sign}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                    {age} years old
                  </Text>
                </View>
                {!isOldEnough && (
                  <View style={{
                    backgroundColor: COLORS.passSurface,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}>
                    <Text style={{ fontSize: 12, color: COLORS.accent, fontFamily: fonts.bodySemiBold }}>
                      Must be 18+
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* ─── Divider ───────────────────────────────────────── */}
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 24 }} />

          {/* ─── Gender ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)}>
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.bodyBold,
              color: COLORS.textSecondary,
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              GENDER
            </Text>
            <View style={{ gap: 10 }}>
              {GENDERS.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGender(g.value);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isSelected ? g.surface : COLORS.surface,
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? g.color : COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{g.emoji}</Text>
                    <Text style={{
                      flex: 1,
                      fontSize: 16,
                      fontFamily: fonts.bodySemiBold,
                      color: isSelected ? g.color : COLORS.text,
                    }}>
                      {g.label}
                    </Text>
                    {isSelected && (
                      <View style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: g.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Text style={{ color: "#FFF", fontSize: 12, fontFamily: fonts.bodyBold }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 0, paddingTop: 8 }}>
        <OnboardingButton
          disabled={!canContinue}
          label={!name.trim() ? "Enter your name" : !hasSelectedDob ? "Select your birthday" : !isOldEnough ? "Must be 18+" : "Continue"}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ name: name.trim(), dob: date, gender });
            router.push("/(onboarding)/photos");
          }}
        />
        <TouchableOpacity
          onPress={signOut}
          activeOpacity={0.6}
          style={{ alignSelf: "center", paddingVertical: 14 }}
        >
          <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: COLORS.textMuted }}>
            Sign in as someone else
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
