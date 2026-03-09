import {
  canSwipeRight,
  canSuperLike,
  getRemainingRightSwipes,
  getRemainingSuperLikes,
  type DailySwipeCounts,
} from "../swipe-limits";
import { FREE_DAILY_RIGHT_SWIPES, PREMIUM_DAILY_SUPER_LIKES } from "../constants";

// ─── canSwipeRight ──────────────────────────────────────────
describe("canSwipeRight", () => {
  it("returns true for premium users regardless of count", () => {
    expect(canSwipeRight({ rightCount: 999, superLikeCount: 0 }, true)).toBe(true);
  });

  it("returns true for free users under the limit", () => {
    expect(canSwipeRight({ rightCount: 0, superLikeCount: 0 }, false)).toBe(true);
    expect(canSwipeRight({ rightCount: FREE_DAILY_RIGHT_SWIPES - 1, superLikeCount: 0 }, false)).toBe(true);
  });

  it("returns false for free users at or over the limit", () => {
    expect(canSwipeRight({ rightCount: FREE_DAILY_RIGHT_SWIPES, superLikeCount: 0 }, false)).toBe(false);
    expect(canSwipeRight({ rightCount: FREE_DAILY_RIGHT_SWIPES + 5, superLikeCount: 0 }, false)).toBe(false);
  });
});

// ─── canSuperLike ──────────────────────────────────────────
describe("canSuperLike", () => {
  it("returns false for free users (super likes are premium-only)", () => {
    expect(canSuperLike({ rightCount: 0, superLikeCount: 0 }, false)).toBe(false);
  });

  it("returns true for premium users under the daily limit", () => {
    expect(canSuperLike({ rightCount: 0, superLikeCount: 0 }, true)).toBe(true);
    expect(canSuperLike({ rightCount: 0, superLikeCount: PREMIUM_DAILY_SUPER_LIKES - 1 }, true)).toBe(true);
  });

  it("returns false for premium users at or over the daily limit", () => {
    expect(canSuperLike({ rightCount: 0, superLikeCount: PREMIUM_DAILY_SUPER_LIKES }, true)).toBe(false);
    expect(canSuperLike({ rightCount: 0, superLikeCount: PREMIUM_DAILY_SUPER_LIKES + 1 }, true)).toBe(false);
  });
});

// ─── getRemainingRightSwipes ───────────────────────────────
describe("getRemainingRightSwipes", () => {
  it("returns null for premium users (unlimited)", () => {
    expect(getRemainingRightSwipes({ rightCount: 10, superLikeCount: 0 }, true)).toBeNull();
  });

  it("returns correct remaining count for free users", () => {
    expect(getRemainingRightSwipes({ rightCount: 0, superLikeCount: 0 }, false)).toBe(FREE_DAILY_RIGHT_SWIPES);
    expect(getRemainingRightSwipes({ rightCount: 10, superLikeCount: 0 }, false)).toBe(FREE_DAILY_RIGHT_SWIPES - 10);
  });

  it("never returns negative", () => {
    expect(getRemainingRightSwipes({ rightCount: 100, superLikeCount: 0 }, false)).toBe(0);
  });
});

// ─── getRemainingSuperLikes ───────────────────────────────
describe("getRemainingSuperLikes", () => {
  it("returns correct remaining count", () => {
    expect(getRemainingSuperLikes({ rightCount: 0, superLikeCount: 0 })).toBe(PREMIUM_DAILY_SUPER_LIKES);
    expect(getRemainingSuperLikes({ rightCount: 0, superLikeCount: 2 })).toBe(PREMIUM_DAILY_SUPER_LIKES - 2);
  });

  it("never returns negative", () => {
    expect(getRemainingSuperLikes({ rightCount: 0, superLikeCount: 100 })).toBe(0);
  });
});
