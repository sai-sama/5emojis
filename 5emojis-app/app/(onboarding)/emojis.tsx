import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import EmojiPicker from "../../components/EmojiPicker";
import { isCustomEmoji, getCustomEmojiComponent } from "../../components/custom-emojis";

function SelectedSlot({ emoji, onRemove }: { emoji?: string; onRemove: () => void }) {
  const isCustom = emoji && isCustomEmoji(emoji);
  const CustomComponent = isCustom ? getCustomEmojiComponent(emoji) : null;
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
        backgroundColor: filled ? "#EDE9FE" : "#F3F4F6",
        borderWidth: filled ? 0 : 2,
        borderStyle: "dashed",
        borderColor: "#D1D5DB",
      }}
    >
      {CustomComponent ? (
        <CustomComponent size={32} />
      ) : emoji ? (
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function EmojisScreen() {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }} edges={["bottom"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#2D3436" }}>
          Pick your 5 emojis
        </Text>
        <Text style={{ fontSize: 15, color: "#636E72", marginTop: 2 }}>
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
          maxSelection={5}
        />
      </View>

      {/* Continue button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
        <TouchableOpacity
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            backgroundColor: isFull ? "#6C5CE7" : "#D1D5DB",
          }}
          disabled={!isFull}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push("/(onboarding)/details");
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 17, fontWeight: "600" }}>
            {isFull ? "Continue" : `Pick ${5 - selectedEmojis.length} more`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
