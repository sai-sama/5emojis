import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import AuroraBackground from "../../components/skia/AuroraBackground";
import LottieCelebration from "../../components/lottie/LottieCelebration";
import ReportModal from "../../components/ReportModal";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { fetchMatches, unmatchUser, type MatchWithProfile } from "../../lib/swipe-service";
import {
  fetchMessages,
  fetchIcebreakerQuestion,
  sendIcebreakerResponse,
  sendMessage,
  getChatState,
  subscribeToMessages,
  markMessagesAsRead,
  toggleReaction,
  fetchReactions,
  subscribeToReactions,
  REACTION_EMOJIS,
  MESSAGE_PAGE_SIZE,
  type ChatState,
} from "../../lib/message-service";
import { blockUser } from "../../lib/block-report-service";
import { notifyNewMessage, setActiveChatId } from "../../lib/push-notifications";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { getZodiacSign } from "../../lib/zodiac";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { Message, MessageReaction } from "../../lib/types";
import EmojiPicker from "../../components/EmojiPicker";
import { logError } from "../../lib/error-logger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ChatScreen() {
  const params = useLocalSearchParams<{ matchId: string; icebreakerQuestion?: string }>();
  const matchId = params.matchId;
  const { session } = useAuth();
  const [matchData, setMatchData] = useState<MatchWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Use route param immediately if available, DB fetch will overwrite if needed
  const [icebreakerQuestion, setIcebreakerQuestion] = useState<string | null>(
    params.icebreakerQuestion || null
  );
  const [chatState, setChatState] = useState<ChatState>("icebreaker_pending");
  const [loading, setLoading] = useState(true);

  // Icebreaker emoji picker state
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [sendingIcebreaker, setSendingIcebreaker] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Text chat state
  const [textInput, setTextInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reveals state
  const [revealsExpanded, setRevealsExpanded] = useState(false);

  // Reactions state
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);

  // Typing indicator state
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Block & Report state
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const currentUserId = session?.user?.id ?? "";

  // ─── Track active chat for notification suppression ─────────
  useFocusEffect(
    useCallback(() => {
      if (matchId) setActiveChatId(matchId);
      return () => setActiveChatId(null);
    }, [matchId])
  );

  // ─── Load match data + messages + icebreaker question ──────
  useFocusEffect(
    useCallback(() => {
      if (!session?.user || !matchId) {
        // No auth (dev/mock mode) — stop loading so route-param question shows
        setLoading(false);
        return;
      }
      (async () => {
        try {
          const matches = await fetchMatches(session.user.id);
          const found = matches.find((m) => m.match.id === matchId);
          if (!found) {
            // Match was deleted or user is blocked — go back
            router.back();
            return;
          }
          setMatchData(found);

          // Only overwrite route-param question if DB actually has one
          if (found?.match.icebreaker_question_id) {
            const q = await fetchIcebreakerQuestion(found.match.icebreaker_question_id);
            if (q) setIcebreakerQuestion(q);
          }

          const msgs = await fetchMessages(matchId, MESSAGE_PAGE_SIZE);
          setMessages(msgs);
          setHasMoreMessages(msgs.length >= MESSAGE_PAGE_SIZE);

          if (found) {
            const otherUserId =
              found.match.user1_id === session.user.id
                ? found.match.user2_id
                : found.match.user1_id;
            setChatState(getChatState(msgs, session.user.id, otherUserId));
          }

          markMessagesAsRead(matchId, session.user.id);

          // Fetch reactions
          const rxns = await fetchReactions(matchId);
          setReactions(rxns);
        } catch (err: any) {
          console.warn("Chat data load failed:", err);
          logError(err, { screen: "ChatScreen", context: "load_chat_data" });
        } finally {
          setLoading(false);
        }
      })();
    }, [session, matchId])
  );

  // ─── Real-time message subscription ─────────────────────────
  useEffect(() => {
    if (!matchId || !session?.user) return;

    const unsubscribe = subscribeToMessages(
      matchId,
      // INSERT handler — new messages
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;

          // Replace optimistic message if this is the real version from the server
          // (same sender + content, optimistic ID prefix)
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.id.startsWith("optimistic-") &&
              m.sender_id === newMsg.sender_id &&
              m.content === newMsg.content
          );
          const updated =
            optimisticIdx >= 0
              ? [...prev.slice(0, optimisticIdx), ...prev.slice(optimisticIdx + 1), newMsg]
              : [...prev, newMsg];

          // Recalculate chat state
          const other = matchData;
          if (other) {
            const otherUserId =
              other.match.user1_id === session.user.id
                ? other.match.user2_id
                : other.match.user1_id;
            setChatState(getChatState(updated, session.user.id, otherUserId));
          }

          return updated;
        });

        // Mark as read if from other user
        if (newMsg.sender_id !== session.user.id) {
          markMessagesAsRead(matchId, session.user.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      // UPDATE handler — read receipts and other field changes
      (updatedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );
      }
    );

    // Also subscribe to reaction changes
    const unsubReactions = subscribeToReactions(matchId, () => {
      fetchReactions(matchId).then(setReactions);
    });

    return () => {
      unsubscribe();
      unsubReactions();
    };
  }, [matchId, session, matchData]);

  // ─── Typing indicator via broadcast ──────────────────────────
  useEffect(() => {
    if (!matchId || !session?.user) return;
    const channel = supabase.channel(`typing:${matchId}`);
    typingChannelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId !== session.user.id) {
          setOtherIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, session]);

  // Broadcast typing when user types (debounced to avoid flooding)
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastTyping = useCallback(() => {
    if (!session?.user || !typingChannelRef.current) return;
    if (typingDebounceRef.current) return; // Already broadcasted recently
    typingChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: session.user.id },
    });
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
    }, 2000);
  }, [session]);

  // ─── Derived data ──────────────────────────────────────────
  const other = matchData?.otherUser;
  const otherUserId = matchData
    ? matchData.match.user1_id === currentUserId
      ? matchData.match.user2_id
      : matchData.match.user1_id
    : "";
  const zodiac = other ? getZodiacSign(other.dob) : null;
  const age = other ? calculateAge(other.dob) : 0;

  // Icebreaker responses
  const myIcebreaker = messages.find(
    (m) => m.sender_id === currentUserId && m.is_emoji_only
  );
  const otherIcebreaker = messages.find(
    (m) => m.sender_id === otherUserId && m.is_emoji_only
  );

  // Regular text messages (everything after icebreaker responses)
  const textMessages = messages.filter((m) => !m.is_emoji_only);

  // ─── Emoji toggle for icebreaker ───────────────────────────
  const handleEmojiToggle = useCallback(
    (emoji: string) => {
      setSelectedEmojis((prev) => {
        if (prev.includes(emoji)) return prev.filter((e) => e !== emoji);
        if (prev.length >= 5) return prev;
        const next = [...prev, emoji];
        if (next.length === 5) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2500);
        }
        return next;
      });
    },
    []
  );

  const handleSetAll = useCallback((emojis: string[]) => {
    setSelectedEmojis(emojis.slice(0, 5));
    if (emojis.length >= 5) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    }
  }, []);

  // ─── Send icebreaker response ──────────────────────────────
  const handleSendIcebreaker = useCallback(async () => {
    if (selectedEmojis.length !== 5 || !session?.user || !matchId) return;
    setSendingIcebreaker(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { error } = await sendIcebreakerResponse(
      matchId,
      session.user.id,
      selectedEmojis
    );

    if (error) {
      Alert.alert("Failed to send", "Please check your connection and try again.");
      setSendingIcebreaker(false);
      return;
    }

    // Refresh messages to update chat state
    const msgs = await fetchMessages(matchId);
    setMessages(msgs);
    setChatState(getChatState(msgs, session.user.id, otherUserId));

    // Notify the other user
    if (otherUserId) {
      notifyNewMessage(otherUserId, other?.name ?? "Someone", matchId, true).catch(() => {});
    }
    setSendingIcebreaker(false);
  }, [selectedEmojis, session, matchId, otherUserId, other]);

  // ─── Send text message ────────────────────────────────────
  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || !session?.user || !matchId) return;
    setSendingMessage(true);
    setTextInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic: append message locally before server confirms
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      match_id: matchId,
      sender_id: session.user.id,
      content: text,
      is_emoji_only: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    const { error } = await sendMessage(matchId, session.user.id, text);

    if (error) {
      // Remove optimistic message and restore input
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setTextInput(text);
      Alert.alert("Failed to send", "Please check your connection and try again.");
      setSendingMessage(false);
      return;
    }

    // Notify the other user
    if (otherUserId) {
      notifyNewMessage(otherUserId, other?.name ?? "Someone", matchId, false).catch(() => {});
    }
    setSendingMessage(false);
  }, [textInput, session, matchId, otherUserId, other]);

  // ─── Load older messages (pagination) ────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestDate = messages[0]?.created_at;
      const older = await fetchMessages(matchId, MESSAGE_PAGE_SIZE, oldestDate);
      if (older.length < MESSAGE_PAGE_SIZE) setHasMoreMessages(false);
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
    } catch (err: any) {
      logError(err, { screen: "ChatScreen", context: "load_more_messages" });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreMessages, messages, matchId]);

  // ─── Emoji reaction handler ────────────────────────────────
  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!session?.user) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setReactionPickerMessageId(null);
      await toggleReaction(messageId, session.user.id, emoji);
      // Re-fetch reactions
      const rxns = await fetchReactions(matchId);
      setReactions(rxns);
    },
    [session, matchId]
  );

  // ─── Date separator helper ────────────────────────────────
  const formatDateSeparator = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) return "Today";
    if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Block handler ──────────────────────────────────────────
  const handleBlock = useCallback(() => {
    if (!session?.user || !otherUserId) return;
    Alert.alert(
      `Block ${other?.name ?? "this person"}?`,
      "They won't be able to see your profile or contact you. Your match and messages will be removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            await blockUser(session.user.id, otherUserId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  }, [session, otherUserId, other]);

  // ─── Unmatch handler ───────────────────────────────────────
  const handleUnmatch = useCallback(() => {
    if (!matchId) return;
    Alert.alert(
      `Unmatch ${other?.name ?? "this person"}?`,
      "This will remove your match and messages. They won't be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            const { error } = await unmatchUser(matchId);
            if (error) {
              Alert.alert("Error", error);
              return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  }, [matchId, other]);

  // ─── Split emojis string into array ────────────────────────
  const splitEmojis = (content: string): string[] => {
    // Match complete emoji grapheme clusters:
    // handles ZWJ sequences (👨‍🍳), variation selectors (⚖️), skin tones (👋🏽)
    const regex =
      /\p{Extended_Pictographic}(?:[\u{1F3FB}-\u{1F3FF}]|\uFE0F?\u200D\p{Extended_Pictographic})*\uFE0F?/gu;
    return content.match(regex) ?? [];
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AuroraBackground variant="warm" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </Pressable>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : other ? (
            <Pressable
              style={styles.headerInfo}
              onPress={() => router.push(`/user/${otherUserId}`)}
            >
              {matchData?.otherPhoto ? (
                <Image
                  source={{ uri: matchData.otherPhoto.url }}
                  style={styles.headerPhoto}
                />
              ) : (
                <View style={[styles.headerPhoto, styles.headerPhotoPlaceholder]}>
                  <Ionicons name="person" size={18} color={COLORS.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.headerName}>
                  {other.name}, {age} {zodiac?.emoji}
                </Text>
                {other.profession ? (
                  <Text style={styles.headerProfession}>{other.profession}</Text>
                ) : null}
              </View>
            </Pressable>
          ) : null}

          {/* Three-dots menu */}
          {other && (
            <Pressable
              onPress={() => setShowMenu((v) => !v)}
              hitSlop={12}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Dropdown menu */}
        {showMenu && (
          <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuDropdown}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push(`/user/${otherUserId}`);
                }}
              >
                <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>
                  View Profile
                </Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginVertical: 2 }} />
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  handleUnmatch();
                }}
              >
                <Ionicons name="heart-dislike-outline" size={18} color={COLORS.textSecondary} />
                <Text style={[styles.menuItemText, { color: COLORS.textSecondary }]}>
                  Unmatch
                </Text>
              </Pressable>
              <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginVertical: 2 }} />
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setShowReportModal(true);
                }}
              >
                <Ionicons name="flag-outline" size={18} color={COLORS.accent} />
                <Text style={[styles.menuItemText, { color: COLORS.accent }]}>
                  Report
                </Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  handleBlock();
                }}
              >
                <Ionicons name="ban-outline" size={18} color={COLORS.accent} />
                <Text style={[styles.menuItemText, { color: COLORS.accent }]}>
                  Block
                </Text>
              </Pressable>
            </View>
          </Pressable>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* ─── Icebreaker Question Card (pending/waiting only) ── */}
            {icebreakerQuestion && chatState !== "chat_active" && (
              <Animated.View
                entering={FadeInDown.duration(400)}
                style={styles.icebreakerCard}
              >
                <View style={styles.icebreakerCardInner}>
                  <Text style={styles.icebreakerCardEmoji}>❓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.icebreakerCardLabel}>Icebreaker</Text>
                    <Text style={styles.icebreakerCardText}>
                      5 Emojis I would use to describe...{"\n"}
                      <Text style={styles.icebreakerCardQuestion}>{icebreakerQuestion}?</Text>
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* ─── STATE: icebreaker_pending ──────────────── */}
            {chatState === "icebreaker_pending" && (
              <View style={{ flex: 1 }}>
                {/* Other user's blurred response (if they've answered) */}
                {otherIcebreaker && (
                  <View style={styles.blurredResponseContainer}>
                    <View style={styles.blurredResponseRow}>
                      {splitEmojis(otherIcebreaker.content)
                        .slice(0, 5)
                        .map((_, i) => (
                          <View key={i} style={styles.blurredEmojiCircle}>
                            <Text style={styles.blurredEmojiText}>?</Text>
                          </View>
                        ))}
                    </View>
                    <Text style={styles.blurredLabel}>
                      🔒 Answer to reveal {other?.name}'s emojis
                    </Text>
                  </View>
                )}

                {/* Selected emojis preview */}
                <View style={styles.selectedPreview}>
                  <Text style={styles.selectedLabel}>Your answer:</Text>
                  <View style={styles.selectedRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Animated.View
                        key={i}
                        entering={FadeInDown.duration(300).delay(100 + i * 80)}
                      >
                        <Pressable
                          onPress={() => {
                            if (selectedEmojis[i]) {
                              handleEmojiToggle(selectedEmojis[i]);
                            }
                          }}
                          style={[
                            styles.selectedSlot,
                            selectedEmojis[i] && styles.selectedSlotFilled,
                          ]}
                        >
                          {selectedEmojis[i] ? (
                            <Text style={styles.selectedSlotEmoji}>
                              {selectedEmojis[i]}
                            </Text>
                          ) : (
                            <Text style={styles.selectedSlotPlaceholder}>
                              {i + 1}
                            </Text>
                          )}
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                  {showCelebration && <LottieCelebration />}
                </View>

                {/* Send button */}
                <Animated.View entering={FadeInDown.duration(400).delay(500)}>
                  <Pressable
                    onPress={handleSendIcebreaker}
                    disabled={selectedEmojis.length !== 5 || sendingIcebreaker}
                    style={[
                      styles.sendIcebreakerButton,
                      selectedEmojis.length !== 5 && styles.sendIcebreakerDisabled,
                    ]}
                  >
                    {sendingIcebreaker ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.sendIcebreakerText}>
                        {selectedEmojis.length === 5
                          ? "Send Your 5 Emojis ✨"
                          : `Pick ${5 - selectedEmojis.length} more`}
                      </Text>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Emoji picker */}
                <View style={styles.pickerContainer}>
                  <EmojiPicker
                    selected={selectedEmojis}
                    onToggle={handleEmojiToggle}
                    onSetAll={handleSetAll}
                    maxSelection={5}
                    hideQuickStart
                  />
                </View>
              </View>
            )}

            {/* ─── STATE: icebreaker_waiting ──────────────── */}
            {chatState === "icebreaker_waiting" && (
              <View style={styles.waitingContainer}>
                {/* My response */}
                {myIcebreaker && (
                  <Animated.View
                    entering={FadeIn.duration(400)}
                    style={styles.myResponseContainer}
                  >
                    <Text style={styles.responseLabel}>Your answer</Text>
                    <View style={styles.emojiResponseRow}>
                      {splitEmojis(myIcebreaker.content)
                        .slice(0, 5)
                        .map((emoji, i) => (
                          <View key={i} style={styles.emojiResponseSlot}>
                            <Text style={styles.emojiResponseText}>{emoji}</Text>
                          </View>
                        ))}
                    </View>
                  </Animated.View>
                )}

                {/* Other user's blurred response */}
                <Animated.View
                  entering={FadeIn.delay(200).duration(400)}
                  style={styles.otherResponseContainer}
                >
                  <Text style={styles.responseLabel}>{other?.name}'s answer</Text>
                  <View style={styles.blurredResponseRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View key={i} style={styles.blurredEmojiCircle}>
                        <Text style={styles.blurredEmojiText}>?</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockText}>
                      🔒 Waiting for {other?.name} to answer...
                    </Text>
                  </View>
                </Animated.View>

                {/* Encouragement */}
                <Animated.View
                  entering={FadeInUp.delay(400).duration(400)}
                  style={styles.waitingHint}
                >
                  <Text style={styles.waitingHintEmoji}>⏳</Text>
                  <Text style={styles.waitingHintText}>
                    We'll notify you when {other?.name} answers!
                  </Text>
                </Animated.View>
              </View>
            )}

            {/* ─── STATE: chat_active ─────────────────────── */}
            {chatState === "chat_active" && (
              <View style={{ flex: 1 }}>
                <FlatList
                  ref={flatListRef}
                  data={[
                    // First item: revealed icebreaker responses
                    { type: "icebreaker_reveal" as const, id: "icebreaker" },
                    // Profile reveals (hidden until match)
                    ...(matchData?.otherReveals && matchData.otherReveals.length > 0
                      ? [{ type: "profile_reveals" as const, id: "profile_reveals" }]
                      : []),
                    // Then text messages with date separators
                    ...textMessages.flatMap((m, i) => {
                      const items: { type: "date_separator" | "message"; id: string; message?: Message; date?: string }[] = [];
                      const msgDate = new Date(m.created_at).toDateString();
                      const prevDate = i > 0 ? new Date(textMessages[i - 1].created_at).toDateString() : null;
                      if (i === 0 || msgDate !== prevDate) {
                        items.push({ type: "date_separator", id: `date-${msgDate}`, date: m.created_at });
                      }
                      items.push({ type: "message", id: m.id, message: m });
                      return items;
                    }),
                  ]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.chatList}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: false })
                  }
                  onScrollBeginDrag={() => setReactionPickerMessageId(null)}
                  keyboardDismissMode="interactive"
                  initialNumToRender={MESSAGE_PAGE_SIZE}
                  maxToRenderPerBatch={20}
                  onScroll={(e) => {
                    // Load older messages when user scrolls near the top
                    if (e.nativeEvent.contentOffset.y < 100 && hasMoreMessages) {
                      loadMoreMessages();
                    }
                  }}
                  scrollEventThrottle={200}
                  renderItem={({ item }) => {
                    if (item.type === "icebreaker_reveal") {
                      return (
                        <View style={styles.revealCompact}>
                          {/* Single card with question + both answers */}
                          <View style={styles.revealCard}>
                            {icebreakerQuestion && (
                              <Text style={styles.revealQuestionLine}>
                                ❓ 5 Emojis to describe… {icebreakerQuestion}
                              </Text>
                            )}
                            {myIcebreaker && (
                              <View style={styles.revealRow}>
                                <Text style={styles.revealRowLabel}>You</Text>
                                {splitEmojis(myIcebreaker.content)
                                  .slice(0, 5)
                                  .map((emoji, i) => (
                                    <Text key={i} style={styles.revealRowEmoji}>
                                      {emoji}
                                    </Text>
                                  ))}
                              </View>
                            )}
                            {otherIcebreaker && (
                              <View style={styles.revealRow}>
                                <Text style={styles.revealRowLabel}>
                                  {other?.name}
                                </Text>
                                {splitEmojis(otherIcebreaker.content)
                                  .slice(0, 5)
                                  .map((emoji, i) => (
                                    <Text key={i} style={styles.revealRowEmoji}>
                                      {emoji}
                                    </Text>
                                  ))}
                              </View>
                            )}
                          </View>

                          <View style={styles.revealDivider}>
                            <View style={styles.revealDividerLine} />
                            <Text style={styles.revealDividerText}>
                              ✨ Chat unlocked!
                            </Text>
                            <View style={styles.revealDividerLine} />
                          </View>
                        </View>
                      );
                    }

                    if (item.type === "profile_reveals") {
                      const reveals = matchData?.otherReveals ?? [];
                      return (
                        <Animated.View
                          entering={FadeInDown.duration(400).delay(200)}
                          style={styles.profileRevealsContainer}
                        >
                          <Pressable
                            onPress={() => setRevealsExpanded((v) => !v)}
                            style={styles.profileRevealsCard}
                          >
                            <View style={styles.profileRevealsHeader}>
                              <Ionicons
                                name="lock-open"
                                size={16}
                                color={COLORS.primary}
                              />
                              <Text style={styles.profileRevealsTitle}>
                                {other?.name}'s Hidden Reveals
                              </Text>
                              <Ionicons
                                name={revealsExpanded ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={COLORS.textSecondary}
                              />
                            </View>
                            {revealsExpanded && (
                              <View style={styles.profileRevealsList}>
                                {reveals.map((reveal, i) => (
                                  <View key={i} style={styles.profileRevealItem}>
                                    <Text style={styles.profileRevealBullet}>
                                      {i + 1}
                                    </Text>
                                    <Text style={styles.profileRevealText}>
                                      {reveal}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </Pressable>
                        </Animated.View>
                      );
                    }

                    // Date separator
                    if (item.type === "date_separator") {
                      return (
                        <View style={styles.dateSeparator}>
                          <View style={styles.dateSeparatorLine} />
                          <Text style={styles.dateSeparatorText}>
                            {formatDateSeparator(item.date!)}
                          </Text>
                          <View style={styles.dateSeparatorLine} />
                        </View>
                      );
                    }

                    // Regular text message
                    const msg = item.message!;
                    const isMe = msg.sender_id === currentUserId;
                    const msgReactions = reactions[msg.id] ?? [];

                    // Group reactions by emoji for display
                    const groupedReactions: { emoji: string; count: number; byMe: boolean }[] = [];
                    const emojiMap = new Map<string, { count: number; byMe: boolean }>();
                    for (const r of msgReactions) {
                      const existing = emojiMap.get(r.emoji);
                      if (existing) {
                        existing.count++;
                        if (r.user_id === currentUserId) existing.byMe = true;
                      } else {
                        emojiMap.set(r.emoji, { count: 1, byMe: r.user_id === currentUserId });
                      }
                    }
                    emojiMap.forEach((val, emoji) => groupedReactions.push({ emoji, ...val }));

                    return (
                      <View
                        style={[
                          styles.messageBubbleWrap,
                          isMe
                            ? styles.messageBubbleWrapMe
                            : styles.messageBubbleWrapOther,
                          groupedReactions.length > 0 && { marginBottom: 14 },
                        ]}
                      >
                        <Pressable
                          onLongPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setReactionPickerMessageId(
                              reactionPickerMessageId === msg.id ? null : msg.id
                            );
                          }}
                          delayLongPress={300}
                          style={[
                            styles.messageBubble,
                            isMe
                              ? styles.messageBubbleMe
                              : styles.messageBubbleOther,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              isMe
                                ? styles.messageTextMe
                                : styles.messageTextOther,
                            ]}
                          >
                            {msg.content}
                          </Text>
                          <View style={styles.messageMetaRow}>
                            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </Text>
                            {isMe && (
                              <Text
                                style={[
                                  styles.readReceiptCheck,
                                  msg.read_at
                                    ? styles.readReceiptRead
                                    : styles.readReceiptUnread,
                                ]}
                              >
                                {msg.read_at ? "\u2713\u2713" : "\u2713"}
                              </Text>
                            )}
                          </View>
                        </Pressable>

                        {/* Reaction quick-picker (shown on long-press) — below bubble */}
                        {reactionPickerMessageId === msg.id && (
                          <Animated.View
                            entering={FadeIn.duration(150)}
                            style={[
                              styles.reactionPicker,
                              isMe ? styles.reactionPickerMe : styles.reactionPickerOther,
                            ]}
                          >
                            {REACTION_EMOJIS.map((emoji) => (
                              <Pressable
                                key={emoji}
                                onPress={() => handleReaction(msg.id, emoji)}
                                style={styles.reactionPickerItem}
                              >
                                <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                              </Pressable>
                            ))}
                          </Animated.View>
                        )}

                        {/* Reaction pills — tucked under the bubble, overlapping */}
                        {groupedReactions.length > 0 && (
                          <View style={[styles.reactionRow, isMe ? styles.reactionRowMe : styles.reactionRowOther]}>
                            {groupedReactions.map(({ emoji, count, byMe }) => (
                              <Pressable
                                key={emoji}
                                onPress={() => handleReaction(msg.id, emoji)}
                                style={[
                                  styles.reactionPill,
                                  byMe && styles.reactionPillMine,
                                ]}
                              >
                                <Text style={styles.reactionEmoji}>{emoji}</Text>
                                {count > 1 && (
                                  <Text style={[styles.reactionCount, byMe && styles.reactionCountMine]}>
                                    {count}
                                  </Text>
                                )}
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  }}
                />

                {/* Typing indicator */}
                {otherIsTyping && (
                  <View style={styles.typingRow}>
                    <Text style={styles.typingText}>
                      {other?.name ?? "They"} is typing
                    </Text>
                    <Text style={styles.typingDots}>...</Text>
                  </View>
                )}

                {/* Text input bar */}
                <View style={styles.inputBar}>
                  <TextInput
                    value={textInput}
                    onChangeText={(text) => {
                      setTextInput(text);
                      broadcastTyping();
                    }}
                    placeholder="Send a message..."
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.textInput}
                    multiline
                    maxLength={500}
                  />
                  <Pressable
                    onPress={handleSendText}
                    disabled={!textInput.trim() || sendingMessage}
                    style={[
                      styles.sendButton,
                      !textInput.trim() && styles.sendButtonDisabled,
                    ]}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.sendButtonText}>↑</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>

      {/* Report modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reporterId={currentUserId}
        reportedId={otherUserId}
        reportedName={other?.name ?? "User"}
        onComplete={() => {
          Alert.alert(
            "Report Submitted",
            "Thank you for helping keep 5Emojis safe.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "300",
    marginLeft: -2,
    marginTop: -1,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  headerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0EDE8",
  },
  headerPhotoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  headerProfession: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  menuDropdown: {
    position: "absolute",
    top: 58,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 51,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Icebreaker question card ────────────────────────────
  icebreakerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  icebreakerCardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icebreakerCardEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  icebreakerCardLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  icebreakerCardText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 21,
  },
  icebreakerCardQuestion: {
    fontFamily: fonts.headingBold,
    color: "#FFF",
    fontSize: 17,
    lineHeight: 24,
  },

  // ─── Blurred response ───────────────────────────────────
  blurredResponseContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  blurredResponseRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  blurredEmojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  blurredEmojiText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontFamily: fonts.bodySemiBold,
  },
  blurredLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // ─── Selected emojis preview (icebreaker_pending) ────────
  selectedPreview: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },
  selectedLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textAlign: "center",
  },
  selectedRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  selectedSlot: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.06)",
    borderStyle: "dashed",
  },
  selectedSlotFilled: {
    borderColor: COLORS.primary,
    borderStyle: "solid",
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
  },
  selectedSlotEmoji: {
    fontSize: 28,
  },
  selectedSlotPlaceholder: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: "rgba(0,0,0,0.1)",
  },

  // ─── Send icebreaker button ─────────────────────────────
  sendIcebreakerButton: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendIcebreakerDisabled: {
    backgroundColor: COLORS.disabled,
  },
  sendIcebreakerText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: "#FFF",
  },

  // ─── Picker container ───────────────────────────────────
  pickerContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  // ─── Waiting state ──────────────────────────────────────
  waitingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  myResponseContainer: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  otherResponseContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  responseLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  emojiResponseRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  emojiResponseSlot: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiResponseText: {
    fontSize: 26,
  },
  lockOverlay: {
    alignItems: "center",
    marginTop: 12,
  },
  lockText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textMuted,
  },
  waitingHint: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  waitingHintEmoji: {
    fontSize: 40,
  },
  waitingHintText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // ─── Chat active — compact icebreaker reveal ───────────
  revealCompact: {
    padding: 12,
    paddingBottom: 4,
    gap: 6,
  },
  revealCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 6,
  },
  revealQuestionLine: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  revealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revealRowLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
    width: 48,
  },
  revealRowEmoji: {
    fontSize: 22,
  },
  revealDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  revealDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  revealDividerText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ─── Profile reveals (hidden until match) ──────────────
  profileRevealsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  profileRevealsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileRevealsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileRevealsTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  profileRevealsList: {
    marginTop: 10,
    gap: 8,
  },
  profileRevealItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  profileRevealBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primarySurface,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
    overflow: "hidden",
  },
  profileRevealText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: COLORS.text,
    lineHeight: 20,
  },

  // ─── Chat messages ─────────────────────────────────────
  chatList: {
    paddingBottom: 8,
  },
  messageBubbleWrap: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  messageBubbleWrapMe: {
    alignItems: "flex-end",
  },
  messageBubbleWrapOther: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    fontFamily: fonts.body,
    lineHeight: 21,
  },
  messageTextMe: {
    color: "#FFF",
  },
  messageTextOther: {
    color: COLORS.text,
  },
  messageMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: "rgba(0,0,0,0.35)",
  },
  messageTimeMe: {
    color: "rgba(255,255,255,0.6)",
  },
  readReceiptCheck: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
  },
  readReceiptRead: {
    color: "rgba(255,255,255,0.7)",
  },
  readReceiptUnread: {
    color: "rgba(255,255,255,0.45)",
  },

  // ─── Date separators ──────────────────────────────────
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textMuted,
  },

  // ─── Emoji reactions ────────────────────────────────────
  reactionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: -8,
    paddingHorizontal: 8,
  },
  reactionRowMe: {
    justifyContent: "flex-end",
  },
  reactionRowOther: {
    justifyContent: "flex-start",
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  reactionPillMine: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySoft,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.textSecondary,
  },
  reactionCountMine: {
    color: COLORS.primary,
  },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 2,
  },
  reactionPickerMe: {
    alignSelf: "flex-end",
  },
  reactionPickerOther: {
    alignSelf: "flex-start",
  },
  reactionPickerItem: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },

  // ─── Typing indicator ──────────────────────────────────
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
  },
  typingDots: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: COLORS.primary,
    marginLeft: 2,
  },

  // ─── Text input bar ────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(255,255,255,0.85)",
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  sendButtonText: {
    fontSize: 18,
    color: "#FFF",
    fontFamily: fonts.headingBold,
  },
});
