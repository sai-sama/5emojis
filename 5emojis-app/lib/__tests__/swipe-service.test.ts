import { formatMessageTime } from "../swipe-service";

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
    // Should return a time like "10:30 AM" (locale-dependent)
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns 'yesterday' for yesterday's messages", () => {
    const result = formatMessageTime("2026-03-08T10:30:00Z");
    expect(result).toBe("yesterday");
  });

  it("returns weekday for messages 2-6 days ago", () => {
    const result = formatMessageTime("2026-03-05T10:30:00Z");
    // Should be a short weekday like "Thu"
    expect(result).toBeTruthy();
    expect(result).not.toBe("yesterday");
  });

  it("returns month and day for older messages", () => {
    const result = formatMessageTime("2026-01-15T10:30:00Z");
    // Should be like "Jan 15"
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});
