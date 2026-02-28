import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import EmojiBackground from "../../components/EmojiBackground";

const ZODIAC_SIGNS: {
  sign: string;
  emoji: string;
  start: [number, number];
  end: [number, number];
}[] = [
  { sign: "Capricorn", emoji: "♑", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", emoji: "♒", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", emoji: "♓", start: [2, 19], end: [3, 20] },
  { sign: "Aries", emoji: "♈", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", emoji: "♉", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", emoji: "♊", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", emoji: "♋", start: [6, 21], end: [7, 22] },
  { sign: "Leo", emoji: "♌", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", emoji: "♍", start: [8, 23], end: [9, 22] },
  { sign: "Libra", emoji: "♎", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", emoji: "♏", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", emoji: "♐", start: [11, 22], end: [12, 21] },
];

function getZodiacSign(date: Date): { sign: string; emoji: string } {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;

    if (sm > em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) {
        return { sign: z.sign, emoji: z.emoji };
      }
    } else {
      if (
        (month === sm && day >= sd) ||
        (month === em && day <= ed) ||
        (month > sm && month < em)
      ) {
        return { sign: z.sign, emoji: z.emoji };
      }
    }
  }
  return { sign: "Capricorn", emoji: "♑" };
}

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
  const zodiac = useMemo(() => getZodiacSign(date), [date]);
  const isOldEnough = age >= 18;

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, dismiss the modal after any action
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDate(selectedDate);
      if (!hasSelected) setHasSelected(true);
      Haptics.selectionAsync();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }} edges={["bottom"]}>
      <EmojiBackground />
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 32 }}>
        <Text style={{ fontSize: 28, fontFamily: fonts.heading, color: "#2D3436" }}>
          🎂  When's your birthday?
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72", marginTop: 4, marginBottom: 32 }}>
          We'll show your age, not your birthday.
        </Text>

        {/* iOS: inline spinner */}
        {Platform.OS === "ios" && (
          <View style={{
            backgroundColor: "#FFF",
            borderRadius: 16,
            paddingVertical: 8,
            marginBottom: 24,
            borderWidth: 1.5,
            borderColor: hasSelected ? "#7C3AED" : "#E8E4DE",
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

        {/* Android: tap-to-open styled button */}
        {Platform.OS === "android" && (
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#FFF",
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              marginBottom: 24,
              borderWidth: 1.5,
              borderColor: hasSelected ? "#7C3AED" : "#E8E4DE",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 14 }}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 18,
                fontFamily: hasSelected ? fonts.bodySemiBold : fonts.body,
                color: hasSelected ? "#2D3436" : "#B2BEC3",
              }}>
                {hasSelected ? formatDate(date) : "Tap to select your birthday"}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#7C3AED", fontFamily: fonts.bodySemiBold }}>
              {hasSelected ? "Change" : "Select"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Android date picker modal — only mounted when needed */}
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
            backgroundColor: "#F5F0FF",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#E4DAFF",
            alignItems: "center",
            gap: 8,
          }}>
            <Text style={{ fontSize: 48 }}>{zodiac.emoji}</Text>
            <Text style={{ fontSize: 20, fontFamily: fonts.headingBold, color: "#7C3AED" }}>
              {zodiac.sign}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72" }}>
              {age} years old
            </Text>

            {!isOldEnough && (
              <View style={{
                backgroundColor: "#FFF0F0",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginTop: 4,
              }}>
                <Text style={{ fontSize: 13, color: "#FF6B6B", fontFamily: fonts.bodySemiBold }}>
                  ⚠️  You must be 18+ to use 5Emojis
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          disabled={!hasSelected || !isOldEnough}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ dob: date });
            router.push("/(onboarding)/photos");
          }}
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            marginBottom: 16,
            backgroundColor: hasSelected && isOldEnough ? "#7C3AED" : "#D1D5DB",
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
