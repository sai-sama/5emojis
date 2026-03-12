import { getStarterPacks, generateIcebreaker, STATIC_POOLS } from "../starter-packs";

describe("getStarterPacks", () => {
  it("returns all static pools", async () => {
    const packs = await getStarterPacks();
    expect(packs).toBe(STATIC_POOLS);
    expect(packs.length).toBeGreaterThan(0);
  });

  it("each pool has label, icon, and non-empty emoji pool", () => {
    for (const pack of STATIC_POOLS) {
      expect(typeof pack.label).toBe("string");
      expect(pack.label.length).toBeGreaterThan(0);
      expect(typeof pack.icon).toBe("string");
      expect(pack.pool.length).toBeGreaterThanOrEqual(20);
    }
  });

  it("each pool has mostly unique emojis (at most 1 duplicate)", () => {
    for (const pack of STATIC_POOLS) {
      const unique = new Set(pack.pool);
      // Allow at most 1 duplicate per pool (some pools have variant emojis)
      expect(pack.pool.length - unique.size).toBeLessThanOrEqual(1);
    }
  });
});

describe("generateIcebreaker", () => {
  it("returns an array of strings", async () => {
    const result = await generateIcebreaker(
      ["🍕", "☕", "🎮", "📚", "🎵"],
      ["🍕", "🌮", "🏋️", "🎬", "🐶"],
      "Alice",
      "Bob"
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const msg of result) {
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("returns at most 3 icebreakers", async () => {
    const result = await generateIcebreaker(
      ["🍕", "☕", "🎮", "📚", "🎵"],
      ["🍕", "🌮", "🏋️", "🎬", "🐶"],
      "Alice",
      "Bob"
    );
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns at least 1 message even for uncommon emojis", async () => {
    const result = await generateIcebreaker(
      ["⚗️", "⚙️", "⚛️", "⚜️", "⚡"],
      ["⚗️", "⚙️", "⚛️", "⚜️", "⚡"],
      "Alice",
      "Bob"
    );
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0]).toBe("string");
  });

  it("returns different results across multiple calls (shuffle works)", async () => {
    const results = new Set<string>();
    // Run 10 times — with Fisher-Yates on 10+ templates, collisions are very unlikely
    for (let i = 0; i < 10; i++) {
      const msgs = await generateIcebreaker(
        ["🍕", "☕", "🎮", "📚", "🎵"],
        ["🍕", "🌮", "🏋️", "🎬", "🐶"],
        "Alice",
        "Bob"
      );
      results.add(msgs.join("|"));
    }
    // Expect at least 2 unique orderings out of 10 runs
    expect(results.size).toBeGreaterThanOrEqual(2);
  });

  it("does not contain unresolved template variables", async () => {
    const result = await generateIcebreaker(
      ["🍕", "☕", "🎮", "📚", "🎵"],
      ["🍕", "🌮", "🏋️", "🎬", "🐶"],
      "Alice",
      "Bob"
    );
    for (const msg of result) {
      expect(msg).not.toMatch(/\{[a-z_]+\}/);
    }
  });
});
