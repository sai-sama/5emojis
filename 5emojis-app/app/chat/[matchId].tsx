import { useState, useCallback } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";
import { fetchMatches, type MatchWithProfile } from "../../lib/swipe-service";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { getZodiacSign } from "../../lib/zodiac";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { session } = useAuth();
  const [matchData, setMatchData] = useState<MatchWithProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user) return;
      (async () => {
        const matches = await fetchMatches(session.user.id);
        const found = matches.find((m) => m.match.id === matchId);
        setMatchData(found ?? null);
        setLoading(false);
      })();
    }, [session, matchId])
  );

  const other = matchData?.otherUser;
  const zodiac = other ? getZodiacSign(other.dob) : null;
  const age = other ? calculateAge(other.dob) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.primarySurface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: COLORS.primary }}>←</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : other ? (
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
            {matchData?.otherPhoto ? (
              <Image
                source={{ uri: matchData.otherPhoto.url }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#F0EDE8",
                }}
              />
            ) : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#F0EDE8",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
            )}
            <View>
              <Text style={{ fontSize: 16, fontFamily: fonts.headingBold, color: COLORS.text }}>
                {other.name}, {age} {zodiac?.emoji}
              </Text>
              {other.profession ? (
                <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                  {other.profession}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {/* Placeholder content */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>💬</Text>
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.headingBold,
            color: COLORS.text,
            marginBottom: 6,
          }}
        >
          Chat coming soon
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: fonts.body,
            color: COLORS.textSecondary,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          Send your first 5 emojis to start the conversation!
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            backgroundColor: COLORS.primary,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 16,
              fontFamily: fonts.bodySemiBold,
            }}
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
