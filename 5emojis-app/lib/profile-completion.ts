import { FullProfile } from "./profile-service";

export type CompletionField = {
  label: string;
  filled: boolean;
  route: string;
};

export function getProfileCompletion(profile: FullProfile): {
  percentage: number;
  total: number;
  filled: number;
  missing: CompletionField[];
} {
  const fields: CompletionField[] = [
    // Core (filled during onboarding)
    { label: "Photos", filled: profile.photos.length > 0, route: "/profile/photos" },
    { label: "Emojis", filled: profile.emojis.length === 5, route: "/profile" },
    { label: "Profession", filled: !!profile.profile.profession, route: "/profile/about" },
    { label: "Interests", filled: profile.interests.length >= 3, route: "/profile/about" },
    { label: "Availability", filled: profile.availability.length > 0, route: "/profile/more" },
    { label: "Personality", filled: !!profile.profile.personality_type, route: "/profile/more" },
    // Optional completion fields
    { label: "Communication Style", filled: !!profile.profile.communication_style, route: "/profile/more" },
    { label: "Kids", filled: !!profile.profile.kids, route: "/profile/more" },
    { label: "Pets", filled: profile.pets.length > 0, route: "/profile/more" },
    { label: "Relationship Status", filled: !!profile.profile.relationship_status, route: "/profile/more" },
    { label: "Work Style", filled: !!profile.profile.work_style, route: "/profile/more" },
    { label: "Dietary Preferences", filled: profile.dietary.length > 0, route: "/profile/more" },
  ];

  const filled = fields.filter((f) => f.filled).length;
  return {
    percentage: Math.round((filled / fields.length) * 100),
    total: fields.length,
    filled,
    missing: fields.filter((f) => !f.filled),
  };
}
