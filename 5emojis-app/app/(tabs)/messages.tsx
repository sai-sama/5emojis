import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import {
  fetchMatches,
  type MatchWithProfile,
} from "../../lib/swipe-service";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import LottieLoading from "../../components/lottie/LottieLoading";
import LottieEmptyState from "../../components/lottie/LottieEmptyState";
import TabHeader from "../../components/navigation/TabHeader";

function MessageRow({ item }: { item: MatchWithProfile }) {
  const { otherUser, otherEmojis, otherPhoto, match } = item;
  const sortedEmojis = [...otherEmojis]
    .sort((a, b) => a.position - b.position)
    .map((e) => e.emoji)
    .join("");

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/chat/${match.id}`)}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {otherPhoto ? (
          <Image source={{ uri: otherPhoto.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {otherUser.name}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          Send the first emojis! {sortedEmojis}
        </Text>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchMatches(session.user.id);
      setMatches(data);
    } catch (err) {
      console.warn("Failed to load messages:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="warm" />
      <View style={styles.container}>
        <TabHeader title="Messages" />

        {loading ? (
          <View style={styles.centered}>
            <LottieLoading message="Loading conversations..." />
          </View>
        ) : matches.length === 0 ? (
          <LottieEmptyState
            title="No conversations yet"
            subtitle="Match with someone to start chatting!"
          />
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.match.id}
            renderItem={({ item }) => <MessageRow item={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.06)",
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F0EDE8",
    borderWidth: 2,
    borderColor: "#F0EBFF",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  preview: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.primary,
    marginLeft: 8,
    opacity: 0.4,
  },
});
