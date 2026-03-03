import { getChatState, ChatState } from "../message-service";
import { Message } from "../types";

// ─── Helpers ─────────────────────────────────────────────────
const CURRENT_USER = "user-a";
const OTHER_USER = "user-b";

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-" + Math.random().toString(36).slice(2),
    match_id: "match-1",
    sender_id: CURRENT_USER,
    content: "Hello!",
    is_emoji_only: false,
    read_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────
describe("getChatState", () => {
  it('returns "icebreaker_pending" when no emoji-only messages from current user', () => {
    // Only the other user has sent a regular text message
    const messages: Message[] = [
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: false }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("icebreaker_pending");
  });

  it('returns "icebreaker_pending" when messages array is empty', () => {
    const state = getChatState([], CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("icebreaker_pending");
  });

  it('returns "icebreaker_waiting" when current user has emoji-only but other does not', () => {
    const messages: Message[] = [
      makeMessage({ sender_id: CURRENT_USER, is_emoji_only: true, content: "12345" }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("icebreaker_waiting");
  });

  it('returns "icebreaker_waiting" when current user has emoji-only and other has only text', () => {
    const messages: Message[] = [
      makeMessage({ sender_id: CURRENT_USER, is_emoji_only: true, content: "12345" }),
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: false, content: "Hey!" }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("icebreaker_waiting");
  });

  it('returns "chat_active" when both users have emoji-only messages', () => {
    const messages: Message[] = [
      makeMessage({ sender_id: CURRENT_USER, is_emoji_only: true, content: "12345" }),
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: true, content: "67890" }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("chat_active");
  });

  it('returns "chat_active" even when additional text messages follow icebreakers', () => {
    const messages: Message[] = [
      makeMessage({ sender_id: CURRENT_USER, is_emoji_only: true, content: "12345" }),
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: true, content: "67890" }),
      makeMessage({ sender_id: CURRENT_USER, is_emoji_only: false, content: "What's up?" }),
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: false, content: "Not much!" }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("chat_active");
  });

  it('returns "icebreaker_pending" when only other user has emoji-only message', () => {
    const messages: Message[] = [
      makeMessage({ sender_id: OTHER_USER, is_emoji_only: true, content: "12345" }),
    ];

    const state = getChatState(messages, CURRENT_USER, OTHER_USER);
    expect(state).toBe<ChatState>("icebreaker_pending");
  });
});
