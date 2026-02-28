// ─── Zodiac sign from date of birth ─────────────────────────
type ZodiacInfo = { sign: string; emoji: string };

const ZODIAC_TABLE: { month: number; day: number; sign: string; emoji: string }[] = [
  { month: 1, day: 19, sign: "Capricorn", emoji: "♑" },
  { month: 2, day: 18, sign: "Aquarius", emoji: "♒" },
  { month: 3, day: 20, sign: "Pisces", emoji: "♓" },
  { month: 4, day: 19, sign: "Aries", emoji: "♈" },
  { month: 5, day: 20, sign: "Taurus", emoji: "♉" },
  { month: 6, day: 20, sign: "Gemini", emoji: "♊" },
  { month: 7, day: 22, sign: "Cancer", emoji: "♋" },
  { month: 8, day: 22, sign: "Leo", emoji: "♌" },
  { month: 9, day: 22, sign: "Virgo", emoji: "♍" },
  { month: 10, day: 22, sign: "Libra", emoji: "♎" },
  { month: 11, day: 21, sign: "Scorpio", emoji: "♏" },
  { month: 12, day: 21, sign: "Sagittarius", emoji: "♐" },
  { month: 12, day: 31, sign: "Capricorn", emoji: "♑" },
];

export function getZodiacSign(dob: string): ZodiacInfo {
  const date = new Date(dob);
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  for (const entry of ZODIAC_TABLE) {
    if (month < entry.month || (month === entry.month && day <= entry.day)) {
      return { sign: entry.sign, emoji: entry.emoji };
    }
  }

  // Fallback (should never reach here)
  return { sign: "Capricorn", emoji: "♑" };
}
