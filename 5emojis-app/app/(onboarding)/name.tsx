import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import EmojiBackground from "../../components/EmojiBackground";

export default function NameScreen() {
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.name);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF8F0" }} edges={["bottom"]}>
      <EmojiBackground />
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 32 }}>
        <Text style={{ fontSize: 28, fontFamily: fonts.heading, color: "#2D3436" }}>
          👋  What's your name?
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72", marginTop: 4, marginBottom: 32 }}>
          This is how you'll appear to others.
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your first name"
          placeholderTextColor="#B2BEC3"
          autoFocus
          autoCapitalize="words"
          style={{
            backgroundColor: "#FFF",
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 18,
            fontFamily: fonts.body,
            color: "#2D3436",
            borderWidth: 1.5,
            borderColor: name.trim() ? "#7C3AED" : "#E8E4DE",
          }}
        />

        {name.trim().length > 0 && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            gap: 8,
          }}>
            <Text style={{ fontSize: 24 }}>✨</Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.body, color: "#636E72" }}>
              Nice to meet you, <Text style={{ fontFamily: fonts.bodyBold, color: "#7C3AED" }}>{name.trim()}</Text>!
            </Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          disabled={!name.trim()}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            update({ name: name.trim() });
            router.push("/(onboarding)/dob");
          }}
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            marginBottom: 16,
            backgroundColor: name.trim() ? "#7C3AED" : "#D1D5DB",
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
