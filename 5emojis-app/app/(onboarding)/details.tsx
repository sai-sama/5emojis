import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import {
  SITUATIONS,
  FRIENDSHIP_STYLES,
  ALL_INTERESTS,
  MAX_INTERESTS,
  MAX_FRIENDSHIP_STYLES,
  getInterestSuggestions,
} from "../../lib/profile-constants";
import OnboardingButton from "../../components/OnboardingButton";

export default function DetailsScreen() {
  const { data, update } = useOnboarding();
  const [profession, setProfession] = useState(data.profession);
  const [selectedSituation, setSelectedSituation] = useState(data.lifeStage);
  const [selectedFriendshipStyles, setSelectedFriendshipStyles] = useState<string[]>(data.friendshipStyles);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interests);

  const toggleFriendshipStyle = (style: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedFriendshipStyles.includes(style)) {
      setSelectedFriendshipStyles(selectedFriendshipStyles.filter((s) => s !== style));
    } else if (selectedFriendshipStyles.length < MAX_FRIENDSHIP_STYLES) {
      setSelectedFriendshipStyles([...selectedFriendshipStyles, style]);
    }
  };

  const toggleInterest = (interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const aiSuggestions = useMemo(
    () => getInterestSuggestions(profession, selectedInterests),
    [profession, selectedInterests]
  );

  const canContinue =
    profession.trim() &&
    selectedSituation &&
    selectedFriendshipStyles.length > 0 &&
    selectedInterests.length >= 3;

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
          Tell us about you
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 28 }}
        >
          Our AI uses this to find your people. Be yourself!
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {/* Profession */}
          <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 8 }}>
            💼  WHAT DO YOU DO?
          </Text>
          <TextInput
            value={profession}
            onChangeText={setProfession}
            placeholder="e.g. Software Engineer, Teacher, Student"
            placeholderTextColor="#B2BEC3"
            autoCapitalize="words"
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1.5,
              borderColor: profession.trim() ? COLORS.primary : COLORS.border,
              marginBottom: 24,
            }}
          />

          {/* Situation */}
          <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>
            🧭  I'M CURRENTLY...
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {SITUATIONS.map(({ label, icon }) => {
              const sel = selectedSituation === label;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSituation(label);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: sel ? COLORS.primary : COLORS.surface,
                    borderWidth: 1.5,
                    borderColor: sel ? COLORS.primary : COLORS.border,
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

          {/* Friendship Style */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.textSecondary, letterSpacing: 0.5 }}>
              🤝  LOOKING FOR
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: "#B2BEC3" }}>
              {selectedFriendshipStyles.length}/{MAX_FRIENDSHIP_STYLES}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {FRIENDSHIP_STYLES.map(({ label, icon }) => {
              const sel = selectedFriendshipStyles.includes(label);
              const full = !sel && selectedFriendshipStyles.length >= MAX_FRIENDSHIP_STYLES;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => toggleFriendshipStyle(label)}
                  disabled={full}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 18,
                    backgroundColor: sel ? COLORS.primary : COLORS.surface,
                    borderWidth: 1.5,
                    borderColor: sel ? COLORS.primary : COLORS.border,
                    opacity: full ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 5 }}>{icon}</Text>
                  <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: sel ? "#FFF" : "#2D3436" }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Interests */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.textSecondary, letterSpacing: 0.5 }}>
              ✨  INTERESTS
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: selectedInterests.length >= 3 ? COLORS.primary : "#B2BEC3" }}>
              {selectedInterests.length}/{MAX_INTERESTS} {selectedInterests.length < 3 ? "(pick at least 3)" : ""}
            </Text>
          </View>

          {/* Picks for you — inside interests */}
          {aiSuggestions.length > 0 && selectedInterests.length < MAX_INTERESTS && (
            <View style={{
              backgroundColor: "#FFF7ED",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: "#FED7AA",
              maxHeight: 90,
              overflow: "hidden",
            }}>
              <Text style={{ fontSize: 10, fontFamily: fonts.heading, color: COLORS.secondary, marginBottom: 6 }}>
                PICKS FOR YOU
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {aiSuggestions.map((label) => {
                  const interest = ALL_INTERESTS.find((i) => i.label === label);
                  if (!interest) return null;
                  const full = selectedInterests.length >= MAX_INTERESTS;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => toggleInterest(label)}
                      disabled={full}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 14,
                        backgroundColor: "#FFF",
                        borderWidth: 1,
                        borderColor: "#FDBA74",
                        opacity: full ? 0.35 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 11, marginRight: 3 }}>{interest.icon}</Text>
                      <Text style={{ fontSize: 11, fontFamily: fonts.bodySemiBold, color: COLORS.secondary }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {ALL_INTERESTS.map(({ label, icon }) => {
              const sel = selectedInterests.includes(label);
              const full = !sel && selectedInterests.length >= MAX_INTERESTS;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => toggleInterest(label)}
                  disabled={full}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 18,
                    backgroundColor: sel ? COLORS.primarySurface : COLORS.surface,
                    borderWidth: 1.5,
                    borderColor: sel ? COLORS.primary : COLORS.border,
                    opacity: full ? 0.35 : 1,
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 5 }}>{icon}</Text>
                  <Text style={{
                    fontSize: 13,
                    fontFamily: fonts.bodySemiBold,
                    color: sel ? COLORS.primary : COLORS.textSecondary,
                  }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 0, paddingTop: 8 }}>
        <OnboardingButton
          disabled={!canContinue}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({
              profession: profession.trim(),
              lifeStage: selectedSituation,
              friendshipStyles: selectedFriendshipStyles,
              interests: selectedInterests,
            });
            router.push("/(onboarding)/location");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
