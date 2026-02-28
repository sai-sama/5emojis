export const COLORS = {
  primary: "#7C3AED",
  secondary: "#F97316",
  accent: "#FF6B6B",
  highlight: "#FBBF24",
  success: "#06B6D4",
  background: "#FFF8F0",
  surface: "#FFFFFF",
  text: "#2D3436",
  textSecondary: "#636E72",
  border: "#E8E4DE",
} as const;

export const MAX_PHOTOS = 5;
export const MAX_EMOJIS = 5;
export const MAX_INTERESTS = 5;
export const MAX_REVEALS = 4;
export const DEFAULT_SEARCH_RADIUS_MILES = 25;

export const LIFE_STAGES = [
  "Student",
  "Working",
  "Freelancer",
  "New Parent",
  "Career Change",
  "Retired",
  "New to City",
] as const;

export const FRIENDSHIP_STYLES = [
  "Activity Buddy",
  "Deep Convos",
  "Group Hangs",
  "Gym Partner",
  "Work Friends",
  "Adventure Crew",
] as const;

// ─── Premium Feature Flags ──────────────────────────────────
// Flip these to `true` to gate features behind premium.
// When true, tapping the feature shows a paywall prompt.
export const PREMIUM_GATES = {
  undoSwipe: false,        // Undo last swipe
  seeWhoVibedYou: false,   // See who swiped right on you
  profileBoost: false,      // Boost profile visibility
  unlimitedEmojiChanges: false, // Change emojis anytime (vs once/week)
} as const;
