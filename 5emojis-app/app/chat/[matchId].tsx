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
import { useAuth } from "../../lib/auth-context";
import { fetchMatches, type MatchWithProfile } from "../../lib/swipe-service";
import {
  fetchMessages,
  fetchIcebreakerQuestion,
  sendIcebreakerResponse,
  sendMessage,
  getChatState,
  subscribeToMessages,
  markMessagesAsRead,
  type ChatState,
} from "../../lib/message-service";
import { calculateAge } from "../../components/swipe/mockProfiles";
import { getZodiacSign } from "../../lib/zodiac";
import { COLORS } from "../../lib/constants";
import { fonts } from "../../lib/fonts";
import { Message } from "../../lib/types";
import EmojiPicker from "../../components/EmojiPicker";

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

  const currentUserId = session?.user?.id ?? "";

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
          setMatchData(found ?? null);

          // Only overwrite route-param question if DB actually has one
          if (found?.match.icebreaker_question_id) {
            const q = await fetchIcebreakerQuestion(found.match.icebreaker_question_id);
            if (q) setIcebreakerQuestion(q);
          }

          const msgs = await fetchMessages(matchId);
          setMessages(msgs);

          if (found) {
            const otherUserId =
              found.match.user1_id === session.user.id
                ? found.match.user2_id
                : found.match.user1_id;
            setChatState(getChatState(msgs, session.user.id, otherUserId));
          }

          markMessagesAsRead(matchId, session.user.id);
        } catch (err) {
          console.warn("Chat data load failed:", err);
        } finally {
          setLoading(false);
        }
      })();
    }, [session, matchId])
  );

  // ─── Real-time message subscription ─────────────────────────
  useEffect(() => {
    if (!matchId || !session?.user) return;

    const unsubscribe = subscribeToMessages(matchId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg];

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
    });

    return unsubscribe;
  }, [matchId, session, matchData]);

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

    if (!error) {
      // Refresh messages to update chat state
      const msgs = await fetchMessages(matchId);
      setMessages(msgs);
      setChatState(getChatState(msgs, session.user.id, otherUserId));
    }
    setSendingIcebreaker(false);
  }, [selectedEmojis, session, matchId, otherUserId]);

  // ─── Send text message ────────────────────────────────────
  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || !session?.user || !matchId) return;
    setSendingMessage(true);
    setTextInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await sendMessage(matchId, session.user.id, text);

    const msgs = await fetchMessages(matchId);
    setMessages(msgs);
    setSendingMessage(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [textInput, session, matchId]);

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
      <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
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
            <View style={styles.headerInfo}>
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
              <View>
                <Text style={styles.headerName}>
                  {other.name}, {age} {zodiac?.emoji}
                </Text>
                {other.profession ? (
                  <Text style={styles.headerProfession}>{other.profession}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

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
                    // Then text messages
                    ...textMessages.map((m) => ({
                      type: "message" as const,
                      id: m.id,
                      message: m,
                    })),
                  ]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.chatList}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: false })
                  }
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

                    // Regular text message
                    const msg = item.message!;
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <View
                        style={[
                          styles.messageBubbleWrap,
                          isMe
                            ? styles.messageBubbleWrapMe
                            : styles.messageBubbleWrapOther,
                        ]}
                      >
                        <View
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
                        </View>
                        <Text style={styles.messageTime}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    );
                  }}
                />

                {/* Text input bar */}
                <View style={styles.inputBar}>
                  <TextInput
                    value={textInput}
                    onChangeText={setTextInput}
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

  // ─── Chat messages ─────────────────────────────────────
  chatList: {
    paddingBottom: 8,
  },
  messageBubbleWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
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
    paddingVertical: 10,
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
  messageTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    marginTop: 2,
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
