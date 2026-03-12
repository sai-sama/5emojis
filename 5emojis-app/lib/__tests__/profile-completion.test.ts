import { getProfileCompletion } from "../profile-completion";
import { FullProfile } from "../profile-service";
import { Profile } from "../types";

// ─── Helpers ─────────────────────────────────────────────────
function makeBaseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    name: "Test User",
    dob: "1995-06-15",
    race: null,
    religion: null,
    profession: null,
    life_stage: null,
    friendship_style: null,
    pronouns: null,
    is_new_to_city: false,
    city: "San Francisco",
    state: "CA",
    zip: null,
    latitude: 37.7749,
    longitude: -122.4194,
    gender: "female",
    personality_type: null,
    preferred_age_min: null,
    preferred_age_max: null,
    communication_style: null,
    kids: null,
    relationship_status: null,
    work_style: null,
    emoji_last_edited_at: null,
    push_token: null,
    search_radius_miles: 50,
    is_suspended: false,
    suspended_at: null,
    suspended_until: null,
    suspension_reason: null,
    is_premium: false,
    premium_until: null,
    revenucat_customer_id: null,
    hidden_emojis: [],
    is_admin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeEmptyFullProfile(): FullProfile {
  return {
    profile: makeBaseProfile(),
    emojis: [],
    photos: [],
    interests: [],
    languages: [],
    availability: [],
    pets: [],
    dietary: [],
    reveals: [],
  };
}

function makeFullFullProfile(): FullProfile {
  return {
    profile: makeBaseProfile({
      profession: "Software Engineer",
      personality_type: "INTJ",
      communication_style: "Direct",
      kids: "None",
      relationship_status: "Single",
      work_style: "Remote",
    }),
    emojis: [
      { id: "e1", user_id: "user-1", emoji: "1", position: 1 },
      { id: "e2", user_id: "user-1", emoji: "2", position: 2 },
      { id: "e3", user_id: "user-1", emoji: "3", position: 3 },
      { id: "e4", user_id: "user-1", emoji: "4", position: 4 },
      { id: "e5", user_id: "user-1", emoji: "5", position: 5 },
    ],
    photos: [
      {
        id: "p1",
        user_id: "user-1",
        url: "https://example.com/photo.jpg",
        position: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
    interests: ["hiking", "coding", "coffee"],
    languages: ["English"],
    availability: ["weekday_evenings"],
    pets: ["dog"],
    dietary: ["vegetarian"],
    reveals: ["I once climbed a mountain"],
  };
}

// ─── Tests ───────────────────────────────────────────────────
describe("getProfileCompletion", () => {
  // Free users: 13 fields (no Hidden Reveals)
  // Premium users: 14 fields (includes Hidden Reveals)

  it("returns 0% for a completely empty free-user profile", () => {
    const result = getProfileCompletion(makeEmptyFullProfile());

    expect(result.percentage).toBe(0);
    expect(result.filled).toBe(0);
    expect(result.total).toBe(13);
    expect(result.missing).toHaveLength(13);
  });

  it("does not include Hidden Reveals for free users", () => {
    const result = getProfileCompletion(makeEmptyFullProfile());
    const missingLabels = result.missing.map((f) => f.label);
    expect(missingLabels).not.toContain("Hidden Reveals");
  });

  it("includes Hidden Reveals for premium users", () => {
    const result = getProfileCompletion(makeEmptyFullProfile(), true);
    expect(result.total).toBe(14);
    const missingLabels = result.missing.map((f) => f.label);
    expect(missingLabels).toContain("Hidden Reveals");
  });

  it("returns 100% for a fully filled free-user profile", () => {
    const full = makeFullFullProfile();
    const result = getProfileCompletion(full);

    expect(result.percentage).toBe(100);
    expect(result.filled).toBe(13);
    expect(result.total).toBe(13);
    expect(result.missing).toHaveLength(0);
  });

  it("returns 100% for a fully filled premium profile", () => {
    const full = makeFullFullProfile();
    const result = getProfileCompletion(full, true);

    expect(result.percentage).toBe(100);
    expect(result.filled).toBe(14);
    expect(result.total).toBe(14);
    expect(result.missing).toHaveLength(0);
  });

  it("correctly identifies missing fields", () => {
    // Profile with only photos and emojis filled
    const partial = makeEmptyFullProfile();
    partial.photos = [
      {
        id: "p1",
        user_id: "user-1",
        url: "https://example.com/photo.jpg",
        position: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ];
    partial.emojis = [
      { id: "e1", user_id: "user-1", emoji: "1", position: 1 },
      { id: "e2", user_id: "user-1", emoji: "2", position: 2 },
      { id: "e3", user_id: "user-1", emoji: "3", position: 3 },
      { id: "e4", user_id: "user-1", emoji: "4", position: 4 },
      { id: "e5", user_id: "user-1", emoji: "5", position: 5 },
    ];

    const result = getProfileCompletion(partial);
    const missingLabels = result.missing.map((f) => f.label);

    expect(result.filled).toBe(2);
    expect(missingLabels).toContain("Profession");
    expect(missingLabels).toContain("Interests");
    expect(missingLabels).toContain("Availability");
    expect(missingLabels).toContain("Personality");
    expect(missingLabels).toContain("Languages");
    expect(missingLabels).not.toContain("Photos");
    expect(missingLabels).not.toContain("Emojis");
  });

  it("correctly counts filled fields for a partially filled profile", () => {
    const partial = makeEmptyFullProfile();
    partial.profile = makeBaseProfile({
      profession: "Designer",
      personality_type: "ENFP",
      communication_style: "Casual",
    });
    partial.interests = ["art", "music", "dance"];
    partial.availability = ["weekends"];

    const result = getProfileCompletion(partial);

    // Filled: Profession, Interests (3 >= 3), Availability, Personality, Communication Style = 5
    expect(result.filled).toBe(5);
    expect(result.percentage).toBe(Math.round((5 / 13) * 100));
  });

  it("requires exactly 5 emojis to count as filled", () => {
    const partial = makeEmptyFullProfile();
    partial.emojis = [
      { id: "e1", user_id: "user-1", emoji: "1", position: 1 },
      { id: "e2", user_id: "user-1", emoji: "2", position: 2 },
      { id: "e3", user_id: "user-1", emoji: "3", position: 3 },
    ];

    const result = getProfileCompletion(partial);
    const missingLabels = result.missing.map((f) => f.label);
    expect(missingLabels).toContain("Emojis");
  });

  it("requires at least 3 interests to count as filled", () => {
    const partial = makeEmptyFullProfile();
    partial.interests = ["hiking", "coding"]; // Only 2, need >= 3

    const result = getProfileCompletion(partial);
    const missingLabels = result.missing.map((f) => f.label);
    expect(missingLabels).toContain("Interests");
  });

  it("counts Languages as filled when at least 1 language is set", () => {
    const partial = makeEmptyFullProfile();
    partial.languages = ["english"];

    const result = getProfileCompletion(partial);
    const missingLabels = result.missing.map((f) => f.label);
    expect(missingLabels).not.toContain("Languages");
    expect(result.filled).toBe(1);
  });

  it("each missing field has a route for navigation", () => {
    const result = getProfileCompletion(makeEmptyFullProfile());

    for (const field of result.missing) {
      expect(field.route).toBeTruthy();
      expect(field.route.startsWith("/profile")).toBe(true);
    }
  });

  it("premium user missing reveals counts toward missing fields", () => {
    const partial = makeEmptyFullProfile();
    // Fill everything except reveals
    partial.profile = makeBaseProfile({
      profession: "Engineer",
      personality_type: "INTJ",
      communication_style: "Direct",
      kids: "None",
      relationship_status: "Single",
      work_style: "Remote",
    });
    partial.emojis = [
      { id: "e1", user_id: "user-1", emoji: "1", position: 1 },
      { id: "e2", user_id: "user-1", emoji: "2", position: 2 },
      { id: "e3", user_id: "user-1", emoji: "3", position: 3 },
      { id: "e4", user_id: "user-1", emoji: "4", position: 4 },
      { id: "e5", user_id: "user-1", emoji: "5", position: 5 },
    ];
    partial.photos = [
      { id: "p1", user_id: "user-1", url: "https://example.com/photo.jpg", position: 1, is_primary: true, created_at: new Date().toISOString() },
    ];
    partial.interests = ["a", "b", "c"];
    partial.languages = ["english"];
    partial.availability = ["weekday_evenings"];
    partial.pets = ["dog"];
    partial.dietary = ["vegan"];

    // As free user — 100% (reveals not counted)
    const freeResult = getProfileCompletion(partial);
    expect(freeResult.percentage).toBe(100);

    // As premium user — missing reveals
    const premResult = getProfileCompletion(partial, true);
    expect(premResult.percentage).toBeLessThan(100);
    expect(premResult.missing.map((f) => f.label)).toContain("Hidden Reveals");
  });
});
