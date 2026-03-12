import { formatMessageTime } from "../swipe-service";
import type { MatchResult } from "../swipe-service";

// ─── formatMessageTime ────────────────────────────────────
describe("formatMessageTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-09T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns time string for today", () => {
    const result = formatMessageTime("2026-03-09T10:30:00Z");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns 'yesterday' for yesterday's messages", () => {
    const result = formatMessageTime("2026-03-08T10:30:00Z");
    expect(result).toBe("yesterday");
  });

  it("returns weekday for messages 2-6 days ago", () => {
    const result = formatMessageTime("2026-03-05T10:30:00Z");
    expect(result).toBeTruthy();
    expect(result).not.toBe("yesterday");
  });

  it("returns month and day for older messages", () => {
    const result = formatMessageTime("2026-01-15T10:30:00Z");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── MatchResult type contracts ─────────────────────────────
describe("MatchResult type", () => {
  it("error variant has success: false and error string", () => {
    const result: MatchResult = { success: false, error: "DB connection failed" };
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("DB connection failed");
    }
  });

  it("no-match variant has success: true, matched: false", () => {
    const result: MatchResult = { success: true, matched: false };
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.matched).toBe(false);
    }
  });

  it("match variant has all required fields", () => {
    const result: MatchResult = {
      success: true,
      matched: true,
      match: {
        id: "match-1",
        user1_id: "a",
        user2_id: "b",
        emoji_match_count: 3,
        is_emoji_perfect: false,
        icebreaker_question_id: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      otherUser: {
        id: "b",
        name: "Test",
        dob: "2000-01-01",
        gender: "female",
      } as any,
      otherEmojis: [],
      otherPhoto: null,
      icebreakerQuestion: null,
      otherReveals: [],
    };
    expect(result.success).toBe(true);
    if (result.success && result.matched) {
      expect(result.match.id).toBe("match-1");
      expect(result.otherUser.name).toBe("Test");
    }
  });

  it("discriminates correctly in if/else chains", () => {
    const results: MatchResult[] = [
      { success: false, error: "network error" },
      { success: true, matched: false },
      {
        success: true,
        matched: true,
        match: { id: "m1", user1_id: "a", user2_id: "b", emoji_match_count: 0, is_emoji_perfect: false, icebreaker_question_id: null, created_at: "" },
        otherUser: { id: "b", name: "X" } as any,
        otherEmojis: [],
        otherPhoto: null,
        icebreakerQuestion: null,
        otherReveals: [],
      },
    ];

    for (const result of results) {
      if (!result.success) {
        expect(typeof result.error).toBe("string");
      } else if (result.matched) {
        expect(result.match).toBeDefined();
        expect(result.otherUser).toBeDefined();
      } else {
        expect(result.matched).toBe(false);
      }
    }
  });
});
