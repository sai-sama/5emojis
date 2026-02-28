import { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import EmojiBackground from "../../components/EmojiBackground";

// "I'm currently..." — completes a sentence naturally
const SITUATIONS = [
  { label: "In School", icon: "📚" },
  { label: "Working", icon: "💼" },
  { label: "Freelancing", icon: "🎨" },
  { label: "A New Parent", icon: "👶" },
  { label: "Switching Careers", icon: "🔄" },
  { label: "Retired", icon: "🌴" },
  { label: "New to the City", icon: "🏙️" },
  { label: "Taking a Gap", icon: "🌎" },
];

const FRIENDSHIP_STYLES = [
  { label: "Activity Buddy", icon: "🏃" },
  { label: "Deep Convos", icon: "💬" },
  { label: "Group Hangs", icon: "🎉" },
  { label: "Gym Partner", icon: "💪" },
  { label: "Work Friends", icon: "👔" },
  { label: "Adventure Crew", icon: "🏔️" },
  { label: "Creative Collab", icon: "🎭" },
  { label: "Study Buddy", icon: "🧠" },
];

const ALL_INTERESTS = [
  { label: "Cooking", icon: "🍳" },
  { label: "Hiking", icon: "🥾" },
  { label: "Music", icon: "🎵" },
  { label: "Gaming", icon: "🎮" },
  { label: "Travel", icon: "✈️" },
  { label: "Fitness", icon: "🏋️" },
  { label: "Reading", icon: "📖" },
  { label: "Photography", icon: "📸" },
  { label: "Art", icon: "🎨" },
  { label: "Movies", icon: "🎬" },
  { label: "Coffee", icon: "☕" },
  { label: "Yoga", icon: "🧘" },
  { label: "Dancing", icon: "💃" },
  { label: "Tech", icon: "💻" },
  { label: "Sports", icon: "⚽" },
  { label: "Fashion", icon: "👗" },
  { label: "Pets", icon: "🐕" },
  { label: "Gardening", icon: "🌱" },
  { label: "Board Games", icon: "🎲" },
  { label: "Wine", icon: "🍷" },
  { label: "Brunch", icon: "🥞" },
  { label: "Volunteering", icon: "💛" },
  { label: "Podcasts", icon: "🎧" },
  { label: "Climbing", icon: "🧗" },
];

const PROFESSION_HINTS: Record<string, string[]> = {
  engineer: ["Tech", "Coffee", "Gaming", "Hiking"],
  software: ["Tech", "Coffee", "Gaming", "Podcasts"],
  developer: ["Tech", "Coffee", "Gaming", "Music"],
  designer: ["Art", "Photography", "Coffee", "Fashion"],
  teacher: ["Reading", "Volunteering", "Coffee", "Hiking"],
  nurse: ["Fitness", "Coffee", "Yoga", "Volunteering"],
  doctor: ["Fitness", "Travel", "Wine", "Podcasts"],
  lawyer: ["Reading", "Wine", "Travel", "Podcasts"],
  student: ["Coffee", "Music", "Gaming", "Brunch"],
  writer: ["Reading", "Coffee", "Podcasts", "Art"],
  chef: ["Cooking", "Wine", "Travel", "Gardening"],
  marketing: ["Brunch", "Podcasts", "Fashion", "Photography"],
  finance: ["Fitness", "Travel", "Wine", "Sports"],
  artist: ["Art", "Music", "Coffee", "Photography"],
  musician: ["Music", "Coffee", "Dancing", "Podcasts"],
  trainer: ["Fitness", "Yoga", "Hiking", "Sports"],
  photographer: ["Photography", "Travel", "Hiking", "Art"],
  default: ["Coffee", "Music", "Travel", "Hiking"],
};

const INTEREST_GRAPH: Record<string, string[]> = {
  Cooking: ["Wine", "Brunch", "Travel", "Gardening"],
  Hiking: ["Climbing", "Fitness", "Photography", "Travel"],
  Music: ["Dancing", "Podcasts", "Art", "Coffee"],
  Gaming: ["Tech", "Board Games", "Movies", "Podcasts"],
  Travel: ["Photography", "Hiking", "Cooking", "Coffee"],
  Fitness: ["Yoga", "Climbing", "Sports", "Hiking"],
  Reading: ["Podcasts", "Coffee", "Art", "Volunteering"],
  Photography: ["Travel", "Hiking", "Art", "Fashion"],
  Art: ["Photography", "Music", "Fashion", "Coffee"],
  Movies: ["Podcasts", "Brunch", "Music", "Gaming"],
  Coffee: ["Brunch", "Reading", "Podcasts", "Music"],
  Yoga: ["Fitness", "Hiking", "Gardening", "Volunteering"],
  Dancing: ["Music", "Fitness", "Fashion", "Brunch"],
  Tech: ["Gaming", "Podcasts", "Coffee", "Photography"],
  Sports: ["Fitness", "Hiking", "Climbing", "Travel"],
  Fashion: ["Art", "Photography", "Brunch", "Dancing"],
  Pets: ["Hiking", "Volunteering", "Photography", "Gardening"],
  Gardening: ["Cooking", "Yoga", "Pets", "Volunteering"],
  "Board Games": ["Gaming", "Brunch", "Coffee", "Wine"],
  Wine: ["Cooking", "Brunch", "Travel", "Art"],
  Brunch: ["Coffee", "Wine", "Fashion", "Cooking"],
  Volunteering: ["Yoga", "Pets", "Reading", "Gardening"],
  Podcasts: ["Coffee", "Reading", "Tech", "Music"],
  Climbing: ["Hiking", "Fitness", "Travel", "Yoga"],
};

function getAISuggestions(profession: string, selected: string[]): string[] {
  const suggestions = new Set<string>();

  const profLower = profession.toLowerCase();
  for (const [keyword, interests] of Object.entries(PROFESSION_HINTS)) {
    if (keyword !== "default" && profLower.includes(keyword)) {
      interests.forEach((i) => suggestions.add(i));
    }
  }
  if (suggestions.size === 0 && profession.trim()) {
    PROFESSION_HINTS.default.forEach((i) => suggestions.add(i));
  }

  for (const interest of selected) {
    const related = INTEREST_GRAPH[interest] || [];
    related.forEach((r) => suggestions.add(r));
  }

  for (const s of selected) suggestions.delete(s);

  return Array.from(suggestions).slice(0, 6);
}

const MAX_INTERESTS = 5;
const MAX_FRIENDSHIP_STYLES = 3;

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
    () => getAISuggestions(profession, selectedInterests),
    [profession, selectedInterests]
  );

  const canContinue =
    profession.trim() &&
    selectedSituation &&
    selectedFriendshipStyles.length > 0 &&
    selectedInterests.length >= 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }} edges={["bottom"]}>
      <EmojiBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, fontFamily: fonts.heading, color: "#2D3436" }}>
          Tell us about you
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72", marginTop: 4, marginBottom: 28 }}>
          Our AI uses this to find your people. Be yourself!
        </Text>

        {/* Profession */}
        <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: "#636E72", letterSpacing: 0.5, marginBottom: 8 }}>
          💼  WHAT DO YOU DO?
        </Text>
        <TextInput
          value={profession}
          onChangeText={setProfession}
          placeholder="e.g. Software Engineer, Teacher, Student"
          placeholderTextColor="#B2BEC3"
          autoCapitalize="words"
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            fontFamily: fonts.body,
            color: "#2D3436",
            borderWidth: 1.5,
            borderColor: profession.trim() ? "#7C3AED" : "#E8E4DE",
            marginBottom: 24,
          }}
        />

        {/* Situation */}
        <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: "#636E72", letterSpacing: 0.5, marginBottom: 10 }}>
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
                  backgroundColor: sel ? "#7C3AED" : "#FFF",
                  borderWidth: 1.5,
                  borderColor: sel ? "#7C3AED" : "#E8E4DE",
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
          <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: "#636E72", letterSpacing: 0.5 }}>
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
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: sel ? "#7C3AED" : "#FFF",
                  borderWidth: 1.5,
                  borderColor: sel ? "#7C3AED" : "#E8E4DE",
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

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && selectedInterests.length < MAX_INTERESTS && (
          <View style={{
            backgroundColor: "#FFF7ED",
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#FED7AA",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.heading, color: "#F97316" }}>
                ✨ PICKS FOR YOU
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 18,
                      backgroundColor: "#FFF",
                      borderWidth: 1.5,
                      borderColor: "#FDBA74",
                      opacity: full ? 0.35 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 14, marginRight: 5 }}>{interest.icon}</Text>
                    <Text style={{ fontSize: 13, fontFamily: fonts.bodySemiBold, color: "#F97316" }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Interests */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: "#636E72", letterSpacing: 0.5 }}>
            ✨  INTERESTS
          </Text>
          <Text style={{ fontSize: 12, fontFamily: fonts.bodyMedium, color: selectedInterests.length >= 3 ? "#7C3AED" : "#B2BEC3" }}>
            {selectedInterests.length}/{MAX_INTERESTS} {selectedInterests.length < 3 ? "(pick at least 3)" : ""}
          </Text>
        </View>
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
                  backgroundColor: sel ? "#F5F0FF" : "#FFF",
                  borderWidth: 1.5,
                  borderColor: sel ? "#7C3AED" : "#E8E4DE",
                  opacity: full ? 0.35 : 1,
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 5 }}>{icon}</Text>
                <Text style={{
                  fontSize: 13,
                  fontFamily: fonts.bodySemiBold,
                  color: sel ? "#7C3AED" : "#636E72",
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8, backgroundColor: "#FFF8F0" }}>
        <TouchableOpacity
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
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            backgroundColor: canContinue ? "#7C3AED" : "#D1D5DB",
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
