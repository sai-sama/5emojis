import {
  GENDERS,
  COLORS,
  MIN_FRIEND_AGE,
  MAX_FRIEND_AGE,
  MAX_PHOTOS,
  MAX_EMOJIS,
  MAX_INTERESTS,
  MAX_REVEALS,
  DEFAULT_SEARCH_RADIUS_MILES,
  DEFAULT_PREFERRED_AGE_MIN,
  DEFAULT_PREFERRED_AGE_MAX,
  EMOJI_EDIT_COOLDOWN_HOURS,
  LIFE_STAGES,
  FRIENDSHIP_STYLES,
  PREMIUM_GATES,
} from "../constants";

describe("GENDERS", () => {
  it("has exactly 3 entries", () => {
    expect(GENDERS).toHaveLength(3);
  });

  it("contains male, female, and nonbinary values", () => {
    const values = GENDERS.map((g) => g.value);
    expect(values).toContain("male");
    expect(values).toContain("female");
    expect(values).toContain("nonbinary");
  });

  it("each gender has required properties", () => {
    for (const gender of GENDERS) {
      expect(gender).toHaveProperty("value");
      expect(gender).toHaveProperty("label");
      expect(gender).toHaveProperty("emoji");
      expect(gender).toHaveProperty("description");
      expect(gender).toHaveProperty("color");
      expect(gender).toHaveProperty("surface");
    }
  });

  it("each gender has a non-empty label", () => {
    for (const gender of GENDERS) {
      expect(gender.label.length).toBeGreaterThan(0);
    }
  });

  it("gender colors are valid hex values", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const gender of GENDERS) {
      expect(gender.color).toMatch(hexRegex);
      expect(gender.surface).toMatch(hexRegex);
    }
  });
});

describe("COLORS", () => {
  it("has required primary color keys", () => {
    expect(COLORS).toHaveProperty("primary");
    expect(COLORS).toHaveProperty("primaryLight");
    expect(COLORS).toHaveProperty("primarySoft");
    expect(COLORS).toHaveProperty("primarySurface");
    expect(COLORS).toHaveProperty("primaryBorder");
  });

  it("has required neutral keys", () => {
    expect(COLORS).toHaveProperty("background");
    expect(COLORS).toHaveProperty("surface");
    expect(COLORS).toHaveProperty("text");
    expect(COLORS).toHaveProperty("textSecondary");
    expect(COLORS).toHaveProperty("textMuted");
    expect(COLORS).toHaveProperty("border");
    expect(COLORS).toHaveProperty("disabled");
  });

  it("has semantic color keys", () => {
    expect(COLORS).toHaveProperty("secondary");
    expect(COLORS).toHaveProperty("accent");
    expect(COLORS).toHaveProperty("vibe");
    expect(COLORS).toHaveProperty("pass");
    expect(COLORS).toHaveProperty("success");
  });

  it("all color values are valid hex strings", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const [key, value] of Object.entries(COLORS)) {
      expect(value).toMatch(hexRegex);
    }
  });
});

describe("Age constants", () => {
  it("MIN_FRIEND_AGE is at least 18", () => {
    expect(MIN_FRIEND_AGE).toBeGreaterThanOrEqual(18);
  });

  it("MAX_FRIEND_AGE is at most 120", () => {
    expect(MAX_FRIEND_AGE).toBeLessThanOrEqual(120);
  });

  it("MIN_FRIEND_AGE is less than MAX_FRIEND_AGE", () => {
    expect(MIN_FRIEND_AGE).toBeLessThan(MAX_FRIEND_AGE);
  });

  it("default preferred ages match min/max boundaries", () => {
    expect(DEFAULT_PREFERRED_AGE_MIN).toBeGreaterThanOrEqual(MIN_FRIEND_AGE);
    expect(DEFAULT_PREFERRED_AGE_MAX).toBeLessThanOrEqual(MAX_FRIEND_AGE);
  });
});

describe("Limit constants", () => {
  it("MAX_PHOTOS is a positive number", () => {
    expect(MAX_PHOTOS).toBeGreaterThan(0);
  });

  it("MAX_EMOJIS is 5", () => {
    expect(MAX_EMOJIS).toBe(5);
  });

  it("MAX_INTERESTS is a positive number", () => {
    expect(MAX_INTERESTS).toBeGreaterThan(0);
  });

  it("MAX_REVEALS is a positive number", () => {
    expect(MAX_REVEALS).toBeGreaterThan(0);
  });

  it("DEFAULT_SEARCH_RADIUS_MILES is a sensible value", () => {
    expect(DEFAULT_SEARCH_RADIUS_MILES).toBeGreaterThan(0);
    expect(DEFAULT_SEARCH_RADIUS_MILES).toBeLessThanOrEqual(500);
  });

  it("EMOJI_EDIT_COOLDOWN_HOURS is 24", () => {
    expect(EMOJI_EDIT_COOLDOWN_HOURS).toBe(24);
  });
});

describe("LIFE_STAGES", () => {
  it("is a non-empty array", () => {
    expect(LIFE_STAGES.length).toBeGreaterThan(0);
  });

  it("includes 'New to City'", () => {
    expect(LIFE_STAGES).toContain("New to City");
  });

  it("includes 'Student'", () => {
    expect(LIFE_STAGES).toContain("Student");
  });
});

describe("FRIENDSHIP_STYLES", () => {
  it("is a non-empty array", () => {
    expect(FRIENDSHIP_STYLES.length).toBeGreaterThan(0);
  });

  it("includes common styles", () => {
    expect(FRIENDSHIP_STYLES).toContain("Activity Buddy");
    expect(FRIENDSHIP_STYLES).toContain("Deep Convos");
  });
});

describe("PREMIUM_GATES", () => {
  it("has expected gate keys", () => {
    expect(PREMIUM_GATES).toHaveProperty("undoSwipe");
    expect(PREMIUM_GATES).toHaveProperty("seeWhoVibedYou");
    expect(PREMIUM_GATES).toHaveProperty("superLikes");
    expect(PREMIUM_GATES).toHaveProperty("unlimitedSwipes");
    expect(PREMIUM_GATES).toHaveProperty("fullFilters");
    expect(PREMIUM_GATES).toHaveProperty("addReveals");
  });

  it("all gates are boolean values", () => {
    for (const [, value] of Object.entries(PREMIUM_GATES)) {
      expect(typeof value).toBe("boolean");
    }
  });
});
