export const COLORS = {
  // ─── Primary (purple) ─────────────────────────
  primary: "#7C3AED",
  primaryLight: "#9B59F0",       // gradient end, lighter purple
  primarySoft: "#EDE4FF",        // slightly tinted background
  primarySurface: "#F5F0FF",     // light purple card/input background
  primaryBorder: "#E4DAFF",      // purple border / divider

  // ─── Secondary & Accent ───────────────────────
  secondary: "#F97316",          // orange
  accent: "#FF6B6B",             // red

  // ─── Highlight (gold) ─────────────────────────
  highlight: "#FBBF24",          // gold
  highlightDark: "#F59E0B",      // darker gold (gradient end)
  highlightSurface: "#FFF7E0",   // light gold background
  highlightMuted: "#FFF3CC",     // muted gold background

  // ─── Vibe (green — swipe right, success) ──────
  vibe: "#34D399",
  vibeDark: "#059669",

  // ─── Pass (pink — swipe left) ─────────────────
  pass: "#FB7185",
  passButton: "#E85D5D",
  passSurface: "#FFF0F0",        // light red/pink background

  // ─── Neutrals ─────────────────────────────────
  background: "#F7EFE3",         // warm latte app background
  surface: "#FFFFFF",            // card / sheet background
  text: "#2D3436",               // primary text
  textSecondary: "#636E72",      // secondary text
  textMuted: "#9CA3AF",          // muted labels, placeholders
  border: "#E8E4DE",             // standard border
  borderLight: "#E2E8F0",        // lighter border / divider
  disabled: "#D1D5DB",           // disabled state gray

  // ─── Other ────────────────────────────────────
  success: "#06B6D4",            // cyan info/success
} as const;

export const MAX_PHOTOS = 5;
export const MAX_EMOJIS = 5;
export const MAX_INTERESTS = 5;
export const MAX_REVEALS = 4;
export const DEFAULT_SEARCH_RADIUS_MILES = 50;

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

// ─── Gender Options ──────────────────────────────────────────
export const GENDERS = [
  { value: "male" as const, label: "Male", emoji: "♂️", description: "Male", color: "#3B82F6", surface: "#EFF6FF" },
  { value: "female" as const, label: "Female", emoji: "♀️", description: "Female", color: "#EC4899", surface: "#FDF2F8" },
  { value: "nonbinary" as const, label: "Non-binary", emoji: "⚧️", description: "Non-binary", color: "#8B5CF6", surface: "#F5F3FF" },
] as const;
export type GenderValue = "male" | "female" | "nonbinary";

// ─── Premium Feature Flags ──────────────────────────────────
// Flip these to `true` to gate features behind premium.
// When true, tapping the feature shows a paywall prompt.
export const PREMIUM_GATES = {
  undoSwipe: false,        // Undo last swipe
  seeWhoVibedYou: false,   // See who swiped right on you
  profileBoost: false,      // Boost profile visibility
  unlimitedEmojiChanges: false, // Change emojis anytime (vs once/week)
} as const;
