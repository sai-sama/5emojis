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
