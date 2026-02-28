import { Profile, ProfileEmoji, ProfilePhoto } from "../../lib/types";

export type SwipeProfile = {
  profile: Profile;
  emojis: ProfileEmoji[];
  photo: ProfilePhoto;
};

export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const miles = Math.round(R * c);
  if (miles < 1) return "Less than a mile away";
  if (miles === 1) return "1 mile away";
  return `${miles} miles away`;
}

function makeEmojis(userId: string, emojis: string[]): ProfileEmoji[] {
  return emojis.map((emoji, i) => ({
    id: `${userId}-emoji-${i}`,
    user_id: userId,
    emoji,
    position: i + 1,
  }));
}

function makePhoto(userId: string, imgNum: number): ProfilePhoto {
  return {
    id: `${userId}-photo-0`,
    user_id: userId,
    url: `https://i.pravatar.cc/800?img=${imgNum}`,
    position: 0,
    is_primary: true,
    created_at: "2025-01-01T00:00:00Z",
  };
}

// San Francisco area coordinates with slight offsets
const SF_LAT = 37.7749;
const SF_LNG = -122.4194;

export const MOCK_PROFILES: SwipeProfile[] = [
  {
    profile: {
      id: "mock-1",
      name: "Priya",
      dob: "1998-03-15",
      race: "South Asian",
      religion: null,
      profession: "Product Designer",
      life_stage: "Working",
      friendship_style: "Deep Convos",
      pronouns: "she/her",
      intent: "friends",
      is_new_to_city: true,
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      latitude: SF_LAT + 0.01,
      longitude: SF_LNG + 0.005,
      search_radius_miles: 25,
      created_at: "2025-01-15T00:00:00Z",
      updated_at: "2025-01-15T00:00:00Z",
    },
    emojis: makeEmojis("mock-1", ["🎨", "☕", "🎵", "🧘", "📸"]),
    photo: makePhoto("mock-1", 5),
  },
  {
    profile: {
      id: "mock-2",
      name: "Marcus",
      dob: "1996-08-22",
      race: "Black",
      religion: null,
      profession: "Software Engineer",
      life_stage: "Working",
      friendship_style: "Activity Buddy",
      pronouns: "he/him",
      intent: "both",
      is_new_to_city: false,
      city: "San Francisco",
      state: "CA",
      zip: "94110",
      latitude: SF_LAT - 0.008,
      longitude: SF_LNG + 0.012,
      search_radius_miles: 25,
      created_at: "2025-02-01T00:00:00Z",
      updated_at: "2025-02-01T00:00:00Z",
    },
    emojis: makeEmojis("mock-2", ["💻", "🏀", "🎮", "🍕", "🎧"]),
    photo: makePhoto("mock-2", 8),
  },
  {
    profile: {
      id: "mock-3",
      name: "Sophie",
      dob: "1999-11-03",
      race: "White",
      religion: null,
      profession: "Grad Student",
      life_stage: "In School",
      friendship_style: "Group Hangs",
      pronouns: "she/her",
      intent: "dating",
      is_new_to_city: true,
      city: "San Francisco",
      state: "CA",
      zip: "94117",
      latitude: SF_LAT + 0.015,
      longitude: SF_LNG - 0.008,
      search_radius_miles: 25,
      created_at: "2025-01-20T00:00:00Z",
      updated_at: "2025-01-20T00:00:00Z",
    },
    emojis: makeEmojis("mock-3", ["📚", "🍷", "🎭", "🌿", "✨"]),
    photo: makePhoto("mock-3", 9),
  },
  {
    profile: {
      id: "mock-4",
      name: "Kai",
      dob: "1997-05-28",
      race: "East Asian",
      religion: null,
      profession: "Photographer",
      life_stage: "Freelancing",
      friendship_style: "Adventure Crew",
      pronouns: "they/them",
      intent: "friends",
      is_new_to_city: false,
      city: "Oakland",
      state: "CA",
      zip: "94612",
      latitude: SF_LAT + 0.03,
      longitude: SF_LNG + 0.04,
      search_radius_miles: 30,
      created_at: "2025-01-10T00:00:00Z",
      updated_at: "2025-01-10T00:00:00Z",
    },
    emojis: makeEmojis("mock-4", ["📷", "🏔️", "🎶", "🍜", "🌅"]),
    photo: makePhoto("mock-4", 11),
  },
  {
    profile: {
      id: "mock-5",
      name: "Aisha",
      dob: "2000-01-12",
      race: "Middle Eastern",
      religion: null,
      profession: "Marketing Manager",
      life_stage: "Working",
      friendship_style: "Deep Convos",
      pronouns: "she/her",
      intent: "both",
      is_new_to_city: true,
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      latitude: SF_LAT - 0.003,
      longitude: SF_LNG - 0.002,
      search_radius_miles: 20,
      created_at: "2025-02-05T00:00:00Z",
      updated_at: "2025-02-05T00:00:00Z",
    },
    emojis: makeEmojis("mock-5", ["💃", "🎬", "🧠", "🌸", "🍵"]),
    photo: makePhoto("mock-5", 25),
  },
  {
    profile: {
      id: "mock-6",
      name: "Tyler",
      dob: "1995-09-17",
      race: "White",
      religion: null,
      profession: "Personal Trainer",
      life_stage: "Working",
      friendship_style: "Gym Partner",
      pronouns: "he/him",
      intent: "dating",
      is_new_to_city: false,
      city: "San Francisco",
      state: "CA",
      zip: "94114",
      latitude: SF_LAT - 0.012,
      longitude: SF_LNG + 0.006,
      search_radius_miles: 15,
      created_at: "2025-01-25T00:00:00Z",
      updated_at: "2025-01-25T00:00:00Z",
    },
    emojis: makeEmojis("mock-6", ["💪", "🥑", "🏄", "🐕", "🎵"]),
    photo: makePhoto("mock-6", 12),
  },
  {
    profile: {
      id: "mock-7",
      name: "Luna",
      dob: "1998-07-04",
      race: "Hispanic",
      religion: null,
      profession: "Nurse",
      life_stage: "Working",
      friendship_style: "Activity Buddy",
      pronouns: "she/her",
      intent: "friends",
      is_new_to_city: false,
      city: "San Francisco",
      state: "CA",
      zip: "94122",
      latitude: SF_LAT + 0.005,
      longitude: SF_LNG - 0.02,
      search_radius_miles: 25,
      created_at: "2025-02-10T00:00:00Z",
      updated_at: "2025-02-10T00:00:00Z",
    },
    emojis: makeEmojis("mock-7", ["🌙", "🎨", "🧗", "☕", "🎸"]),
    photo: makePhoto("mock-7", 32),
  },
  {
    profile: {
      id: "mock-8",
      name: "Jordan",
      dob: "1997-12-20",
      race: "Black",
      religion: null,
      profession: "Music Producer",
      life_stage: "Freelancing",
      friendship_style: "Creative Collab",
      pronouns: "he/him",
      intent: "both",
      is_new_to_city: true,
      city: "San Francisco",
      state: "CA",
      zip: "94103",
      latitude: SF_LAT - 0.005,
      longitude: SF_LNG + 0.003,
      search_radius_miles: 25,
      created_at: "2025-02-08T00:00:00Z",
      updated_at: "2025-02-08T00:00:00Z",
    },
    emojis: makeEmojis("mock-8", ["🎹", "🎤", "🌃", "🔥", "🎧"]),
    photo: makePhoto("mock-8", 14),
  },
  {
    profile: {
      id: "mock-9",
      name: "Mei",
      dob: "1999-04-09",
      race: "East Asian",
      religion: null,
      profession: "Data Scientist",
      life_stage: "Working",
      friendship_style: "Study Buddy",
      pronouns: "she/her",
      intent: "dating",
      is_new_to_city: false,
      city: "San Francisco",
      state: "CA",
      zip: "94108",
      latitude: SF_LAT + 0.002,
      longitude: SF_LNG + 0.001,
      search_radius_miles: 20,
      created_at: "2025-01-30T00:00:00Z",
      updated_at: "2025-01-30T00:00:00Z",
    },
    emojis: makeEmojis("mock-9", ["🧪", "📊", "🍣", "🎮", "🌺"]),
    photo: makePhoto("mock-9", 20),
  },
  {
    profile: {
      id: "mock-10",
      name: "River",
      dob: "1996-02-14",
      race: "Mixed",
      religion: null,
      profession: "Yoga Instructor",
      life_stage: "Freelancing",
      friendship_style: "Adventure Crew",
      pronouns: "they/them",
      intent: "friends",
      is_new_to_city: true,
      city: "Berkeley",
      state: "CA",
      zip: "94704",
      latitude: SF_LAT + 0.04,
      longitude: SF_LNG + 0.03,
      search_radius_miles: 30,
      created_at: "2025-02-12T00:00:00Z",
      updated_at: "2025-02-12T00:00:00Z",
    },
    emojis: makeEmojis("mock-10", ["🧘", "🌊", "🌻", "🥾", "🦋"]),
    photo: makePhoto("mock-10", 16),
  },
];

// Mock current user location (SF downtown)
export const MOCK_USER_LAT = SF_LAT;
export const MOCK_USER_LNG = SF_LNG;

// Mock current user's emojis — overlaps with several mock profiles for testing:
// 🎨 matches Priya(mock-1) + Luna(mock-7)
// ☕ matches Priya(mock-1) + Luna(mock-7)
// 🎮 matches Marcus(mock-2) + Mei(mock-9)
// 🏔️ matches Kai(mock-4)
// 🎵 matches Priya(mock-1) + Tyler(mock-6)
export const MOCK_USER_EMOJIS = ["🎨", "☕", "🎮", "🏔️", "🎵"];

// ─── Mock pre-existing swipes (these users already swiped right on you) ──────
// When you swipe right on them → instant match for testing
export const MOCK_PRE_SWIPED_IDS = new Set([
  "mock-1",  // Priya — 3 emoji overlap (best test for match + emoji count)
  "mock-4",  // Kai — 1 emoji overlap
  "mock-7",  // Luna — 2 emoji overlap
]);
