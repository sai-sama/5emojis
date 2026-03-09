// ─── Shared profile option arrays ────────────────────────────
// Used by both onboarding/details.tsx and profile sub-screens.

export const SITUATIONS = [
  { label: "In School", icon: "📚" },
  { label: "Working", icon: "💼" },
  { label: "Freelancing", icon: "🎨" },
  { label: "A New Parent", icon: "👶" },
  { label: "Switching Careers", icon: "🔄" },
  { label: "Retired", icon: "🌴" },
  { label: "New to the City", icon: "🏙️" },
  { label: "Taking a Gap", icon: "🌎" },
  { label: "Just Living", icon: "😎" },
] as const;

export const FRIENDSHIP_STYLES = [
  // Social
  { label: "Group Hangs", icon: "🎉" },
  { label: "Night Out", icon: "🌙" },
  { label: "Brunch Crew", icon: "🥂" },
  { label: "Coffee Dates", icon: "☕" },
  // Active
  { label: "Gym Partner", icon: "💪" },
  { label: "Adventure Crew", icon: "🏔️" },
  { label: "Running Buddy", icon: "🏃" },
  // One-on-one
  { label: "Deep Convos", icon: "💬" },
  { label: "Walking Buddy", icon: "🚶" },
  // Life stage
  { label: "Work Friends", icon: "👔" },
  { label: "Study Buddy", icon: "🧠" },
  { label: "Parent Friends", icon: "👶" },
  // Hobbies
  { label: "Travel Buddy", icon: "🧳" },
  { label: "Foodie Friend", icon: "🍕" },
  { label: "Creative Collab", icon: "🎭" },
  { label: "Gaming Buddy", icon: "🎮" },
  { label: "Pet Playdate", icon: "🐾" },
  { label: "Festival Crew", icon: "🎪" },
] as const;

export const ALL_INTERESTS = [
  { label: "Cooking", icon: "🍳" },
  { label: "Hiking", icon: "🥾" },
  { label: "Music", icon: "🎵" },
  { label: "Gaming", icon: "🎮" },
  { label: "Travel", icon: "✈️" },
  { label: "Fitness", icon: "🏋️" },
  { label: "Reading", icon: "📖" },
  { label: "Photography", icon: "📸" },
  { label: "Art", icon: "🎨" },
  { label: "Movies", icon: "🎬" },
  { label: "Coffee", icon: "☕" },
  { label: "Yoga", icon: "🧘" },
  { label: "Dancing", icon: "💃" },
  { label: "Tech", icon: "💻" },
  { label: "Sports", icon: "⚽" },
  { label: "Fashion", icon: "👗" },
  { label: "Pets", icon: "🐕" },
  { label: "Gardening", icon: "🌱" },
  { label: "Board Games", icon: "🎲" },
  { label: "Wine", icon: "🍷" },
  { label: "Brunch", icon: "🥞" },
  { label: "Volunteering", icon: "💛" },
  { label: "Podcasts", icon: "🎧" },
  { label: "Climbing", icon: "🧗" },
] as const;

export const RADIUS_STEPS = [5, 10, 25, 50, 100, 250] as const;

// ─── Availability slots ──────────────────────────────────────
export const AVAILABILITY_SLOTS = [
  { label: "Weekday Mornings", value: "weekday_mornings", icon: "🌅" },
  { label: "Weekday Afternoons", value: "weekday_afternoons", icon: "☀️" },
  { label: "Weekday Evenings", value: "weekday_evenings", icon: "🌆" },
  { label: "Weekend Mornings", value: "weekend_mornings", icon: "🥐" },
  { label: "Weekend Afternoons", value: "weekend_afternoons", icon: "🏖️" },
  { label: "Weekend Evenings", value: "weekend_evenings", icon: "🎉" },
  { label: "Anytime!", value: "anytime", icon: "🌟" },
] as const;

export const MAX_AVAILABILITY = 3;

// ─── Personality types ───────────────────────────────────────
export const PERSONALITY_TYPES = [
  { label: "Introvert", value: "introvert", icon: "📖", description: "I recharge alone", color: "#6366F1", surface: "#EEF2FF" },
  { label: "Extrovert", value: "extrovert", icon: "🎤", description: "I recharge with people", color: "#F59E0B", surface: "#FFFBEB" },
  { label: "Ambivert", value: "ambivert", icon: "🔄", description: "A little of both", color: "#10B981", surface: "#ECFDF5" },
] as const;

// ─── Communication style ────────────────────────────────────
export const COMMUNICATION_STYLES = [
  { label: "Texter", value: "texter", icon: "💬" },
  { label: "Caller", value: "caller", icon: "📞" },
  { label: "In-Person Hangouts", value: "in_person", icon: "🤗" },
  { label: "All of the Above", value: "all_of_the_above", icon: "🌟" },
] as const;

// ─── Kids ────────────────────────────────────────────────────
export const KIDS_OPTIONS = [
  { label: "Has Kids", value: "has_kids", icon: "👶" },
  { label: "No Kids", value: "no_kids", icon: "🚫" },
  { label: "Expecting", value: "expecting", icon: "🤰" },
] as const;

// ─── Pets ────────────────────────────────────────────────────
export const PETS_OPTIONS = [
  { label: "Dog", value: "dog", icon: "🐕" },
  { label: "Cat", value: "cat", icon: "🐱" },
  { label: "Other", value: "other", icon: "🐾" },
  { label: "None", value: "none", icon: "❌" },
] as const;

// ─── Relationship Status ────────────────────────────────────
export const RELATIONSHIP_STATUS_OPTIONS = [
  { label: "Single", value: "single", icon: "💫" },
  { label: "In a Relationship", value: "in_a_relationship", icon: "💕" },
  { label: "Married", value: "married", icon: "💍" },
  { label: "It's Complicated", value: "its_complicated", icon: "🤷" },
] as const;

// ─── Work Style ─────────────────────────────────────────────
export const WORK_STYLE_OPTIONS = [
  { label: "Remote", value: "remote", icon: "🏠" },
  { label: "Hybrid", value: "hybrid", icon: "🔀" },
  { label: "In-Office", value: "in_office", icon: "🏢" },
] as const;

// ─── Dietary Preferences ────────────────────────────────────
export const DIETARY_OPTIONS = [
  { label: "Vegan", value: "vegan", icon: "🌱" },
  { label: "Vegetarian", value: "vegetarian", icon: "🥗" },
  { label: "Gluten-Free", value: "gluten_free", icon: "🌾" },
  { label: "Halal", value: "halal", icon: "🍖" },
  { label: "Kosher", value: "kosher", icon: "✡️" },
  { label: "No Restrictions", value: "no_restrictions", icon: "🍽️" },
] as const;

export const COMMON_PROFESSIONS = [
  { label: "Student", icon: "📚" },
  { label: "Engineer", icon: "💻" },
  { label: "Healthcare", icon: "🏥" },
  { label: "Creative", icon: "🎨" },
  { label: "Business", icon: "💼" },
] as const;

export const MAX_INTERESTS = 5;
export const MAX_FRIENDSHIP_STYLES = 3;

// ─── Interest suggestions ("Picks for you") ────────────────
const PROFESSION_HINTS: Record<string, string[]> = {
  engineer: ["Tech", "Coffee", "Gaming", "Hiking"],
  software: ["Tech", "Coffee", "Gaming", "Podcasts"],
  developer: ["Tech", "Coffee", "Gaming", "Music"],
  designer: ["Art", "Photography", "Coffee", "Fashion"],
  teacher: ["Reading", "Volunteering", "Coffee", "Hiking"],
  nurse: ["Fitness", "Coffee", "Yoga", "Volunteering"],
  doctor: ["Fitness", "Travel", "Wine", "Podcasts"],
  lawyer: ["Reading", "Wine", "Travel", "Podcasts"],
  student: ["Coffee", "Music", "Gaming", "Brunch"],
  writer: ["Reading", "Coffee", "Podcasts", "Art"],
  chef: ["Cooking", "Wine", "Travel", "Gardening"],
  marketing: ["Brunch", "Podcasts", "Fashion", "Photography"],
  finance: ["Fitness", "Travel", "Wine", "Sports"],
  artist: ["Art", "Music", "Coffee", "Photography"],
  musician: ["Music", "Coffee", "Dancing", "Podcasts"],
  trainer: ["Fitness", "Yoga", "Hiking", "Sports"],
  photographer: ["Photography", "Travel", "Hiking", "Art"],
  default: ["Coffee", "Music", "Travel", "Hiking"],
};

const INTEREST_GRAPH: Record<string, string[]> = {
  Cooking: ["Wine", "Brunch", "Travel", "Gardening"],
  Hiking: ["Climbing", "Fitness", "Photography", "Travel"],
  Music: ["Dancing", "Podcasts", "Art", "Coffee"],
  Gaming: ["Tech", "Board Games", "Movies", "Podcasts"],
  Travel: ["Photography", "Hiking", "Cooking", "Coffee"],
  Fitness: ["Yoga", "Climbing", "Sports", "Hiking"],
  Reading: ["Podcasts", "Coffee", "Art", "Volunteering"],
  Photography: ["Travel", "Hiking", "Art", "Fashion"],
  Art: ["Photography", "Music", "Fashion", "Coffee"],
  Movies: ["Podcasts", "Brunch", "Music", "Gaming"],
  Coffee: ["Brunch", "Reading", "Podcasts", "Music"],
  Yoga: ["Fitness", "Hiking", "Gardening", "Volunteering"],
  Dancing: ["Music", "Fitness", "Fashion", "Brunch"],
  Tech: ["Gaming", "Podcasts", "Coffee", "Photography"],
  Sports: ["Fitness", "Hiking", "Climbing", "Travel"],
  Fashion: ["Art", "Photography", "Brunch", "Dancing"],
  Pets: ["Hiking", "Volunteering", "Photography", "Gardening"],
  Gardening: ["Cooking", "Yoga", "Pets", "Volunteering"],
  "Board Games": ["Gaming", "Brunch", "Coffee", "Wine"],
  Wine: ["Cooking", "Brunch", "Travel", "Art"],
  Brunch: ["Coffee", "Wine", "Fashion", "Cooking"],
  Volunteering: ["Yoga", "Pets", "Reading", "Gardening"],
  Podcasts: ["Coffee", "Reading", "Tech", "Music"],
  Climbing: ["Hiking", "Fitness", "Travel", "Yoga"],
};

export function getInterestSuggestions(profession: string, selected: string[]): string[] {
  const suggestions = new Set<string>();

  const profLower = profession.toLowerCase();
  for (const [keyword, interests] of Object.entries(PROFESSION_HINTS)) {
    if (keyword !== "default" && profLower.includes(keyword)) {
      interests.forEach((i) => suggestions.add(i));
    }
  }
  if (suggestions.size === 0 && profession.trim()) {
    PROFESSION_HINTS.default.forEach((i) => suggestions.add(i));
  }

  for (const interest of selected) {
    const related = INTEREST_GRAPH[interest] || [];
    related.forEach((r) => suggestions.add(r));
  }

  for (const s of selected) suggestions.delete(s);

  return Array.from(suggestions).slice(0, 6);
}
