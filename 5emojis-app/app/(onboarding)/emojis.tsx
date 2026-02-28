import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import EmojiPicker from "../../components/EmojiPicker";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import EmojiBackground from "../../components/EmojiBackground";

function SelectedSlot({ emoji, onRemove }: { emoji?: string; onRemove: () => void }) {
  const filled = !!emoji;

  return (
    <TouchableOpacity
      onPress={filled ? onRemove : undefined}
      activeOpacity={filled ? 0.6 : 1}
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: filled ? "#F5F0FF" : "#FFF",
        borderWidth: 2,
        borderStyle: filled ? "solid" : "dashed",
        borderColor: filled ? "#7C3AED" : "#D1D5DB",
      }}
    >
      {emoji ? <Text style={{ fontSize: 32 }}>{emoji}</Text> : null}
    </TouchableOpacity>
  );
}

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }} edges={["bottom"]}>
      <EmojiBackground />
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 26, fontFamily: fonts.heading, color: "#2D3436" }}>
          Pick your 5 emojis
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72", marginTop: 2 }}>
          Choose 5 that represent you. Tap to remove.
        </Text>

        {/* Selected slots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 16 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SelectedSlot
              key={i}
              emoji={selectedEmojis[i]}
              onRemove={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedEmojis(selectedEmojis.filter((_, idx) => idx !== i));
              }}
            />
          ))}
        </View>
      </View>

      {/* Emoji picker — fills remaining space */}
      <View style={{ flex: 1 }}>
        <EmojiPicker
          selected={selectedEmojis}
          onToggle={toggleEmoji}
          onSetAll={setSelectedEmojis}
          maxSelection={5}
        />
      </View>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
        <TouchableOpacity
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            backgroundColor: isFull ? "#7C3AED" : "#D1D5DB",
          }}
          disabled={!isFull}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            update({ emojis: selectedEmojis });
            router.push("/(onboarding)/details");
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
            {isFull ? "Continue" : `Pick ${5 - selectedEmojis.length} more`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
