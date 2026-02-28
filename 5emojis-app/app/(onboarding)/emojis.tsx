import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import EmojiPicker from "../../components/EmojiPicker";
import DraggableEmojiSlots from "../../components/DraggableEmojiSlots";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import EmojiBackground from "../../components/EmojiBackground";
import OnboardingButton from "../../components/OnboardingButton";

export default function EmojisScreen() {
  const { data, update } = useOnboarding();
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(data.emojis);

  const toggleEmoji = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji));
    } else if (selectedEmojis.length < 5) {
      const newSelection = [...selectedEmojis, emoji];
      setSelectedEmojis(newSelection);
      if (newSelection.length === 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const isFull = selectedEmojis.length === 5;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <EmojiBackground opacity={0.06} />
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 80, paddingBottom: 12 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 26, fontFamily: fonts.heading, color: COLORS.text }}
        >
          Pick your 5 emojis
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 2 }}
        >
          Express yourself — pick 5 that capture your vibe
        </Animated.Text>

        {/* Selected slots — drag to reorder */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{ marginTop: 16 }}>
          <DraggableEmojiSlots
            emojis={selectedEmojis}
            onReorder={setSelectedEmojis}
            onRemove={(index) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedEmojis(selectedEmojis.filter((_, idx) => idx !== index));
            }}
          />
        </Animated.View>
      </View>

      {/* Emoji picker */}
      <View style={{ flex: 1 }}>
        <EmojiPicker
          selected={selectedEmojis}
          onToggle={toggleEmoji}
          onSetAll={setSelectedEmojis}
          maxSelection={5}
        />
      </View>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 0, paddingTop: 8 }}>
        <OnboardingButton
          disabled={!isFull}
          label={isFull ? "Continue" : `Pick ${5 - selectedEmojis.length} more`}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ emojis: selectedEmojis });
            router.push("/(onboarding)/details");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
