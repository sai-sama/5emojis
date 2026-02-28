/**
 * Emoji data layer — powered by @emoji-mart/data (full Unicode set).
 *
 * Pre-processes at module load time for O(1) lookups.
 * Categories split emoji-mart's giant "people" into Smileys / Hands / People
 * so the picker stays usable.
 */
// @ts-ignore — @emoji-mart/data exports a JSON blob, no TS declarations
import emojiMartData from "@emoji-mart/data";

const data = emojiMartData as any;

// ─── Types ───────────────────────────────────────────────────
export type EmojiCategory = {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
};

type EmojiEntry = {
  name: string;
  keywords: string[];
};

// ─── Build reverse lookup: native emoji → { name, keywords } ─
const LOOKUP = new Map<string, EmojiEntry>();

for (const emoji of Object.values(data.emojis) as any[]) {
  const native: string = emoji.skins?.[0]?.native;
  if (!native) continue;
  LOOKUP.set(native, {
    name: emoji.name ?? emoji.id ?? "",
    keywords: [
      ...(emoji.keywords ?? []),
      emoji.id?.replace(/_/g, " ") ?? "",
      (emoji.name ?? "").toLowerCase(),
    ],
  });
}

// ─── Build categories ────────────────────────────────────────
// emoji-mart's "people" is 529 emojis. We split it at natural breakpoints.
const HAND_START_ID = "wave";
const PERSON_START_ID = "baby";

function resolveNative(id: string): string | null {
  const e = (data.emojis as any)[id];
  return e?.skins?.[0]?.native ?? null;
}

function buildCategories(): EmojiCategory[] {
  const cats: EmojiCategory[] = [];

  for (const cat of data.categories) {
    const natives: string[] = [];
    for (const id of cat.emojis) {
      const n = resolveNative(id);
      if (n) natives.push(n);
    }

    if (cat.id === "people") {
      // Find split points
      let handIdx = cat.emojis.indexOf(HAND_START_ID);
      let personIdx = cat.emojis.indexOf(PERSON_START_ID);
      if (handIdx === -1) handIdx = Math.floor(natives.length * 0.22);
      if (personIdx === -1) personIdx = Math.floor(natives.length * 0.33);

      cats.push(
        { id: "smileys", name: "Smileys", icon: "😀", emojis: natives.slice(0, handIdx) },
        { id: "gestures", name: "Hands", icon: "👋", emojis: natives.slice(handIdx, personIdx) },
        { id: "people", name: "People", icon: "🧑", emojis: natives.slice(personIdx) },
      );
    } else {
      const DISPLAY: Record<string, { name: string; icon: string }> = {
        nature: { name: "Nature", icon: "🌿" },
        foods: { name: "Food", icon: "🍕" },
        activity: { name: "Activities", icon: "⚽" },
        places: { name: "Travel", icon: "✈️" },
        objects: { name: "Objects", icon: "💡" },
        symbols: { name: "Symbols", icon: "❤️" },
        flags: { name: "Flags", icon: "🏳️" },
      };
      const d = DISPLAY[cat.id] ?? { name: cat.id, icon: "📦" };
      cats.push({ id: cat.id, name: d.name, icon: d.icon, emojis: natives });
    }
  }

  return cats;
}

export const CATEGORIES = buildCategories();

// ─── Search index (pre-built, one-time cost) ────────────────
type SearchEntry = { emoji: string; terms: string };

const SEARCH_INDEX: SearchEntry[] = [];
for (const [native, entry] of LOOKUP) {
  SEARCH_INDEX.push({
    emoji: native,
    terms: [entry.name.toLowerCase(), ...entry.keywords].join(" "),
  });
}

/**
 * Search emojis by query. Returns matching native emojis.
 * Matches against name, keywords, and aliases.
 */
export function searchEmojis(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Exact-first ranking: emojis whose name starts with query rank higher
  const exact: string[] = [];
  const partial: string[] = [];

  for (const entry of SEARCH_INDEX) {
    if (entry.terms.includes(q)) {
      // Check if name starts with query for priority
      const name = LOOKUP.get(entry.emoji)?.name.toLowerCase() ?? "";
      if (name.startsWith(q) || name.includes(" " + q)) {
        exact.push(entry.emoji);
      } else {
        partial.push(entry.emoji);
      }
    }
  }

  return [...exact, ...partial];
}

/**
 * Get display name for an emoji.
 */
export function getEmojiDisplayName(emoji: string): string | null {
  return LOOKUP.get(emoji)?.name ?? null;
}

// ─── Stats (for debugging) ──────────────────────────────────
export const EMOJI_COUNT = LOOKUP.size;
export const CATEGORY_COUNTS = CATEGORIES.map((c) => `${c.name}: ${c.emojis.length}`);
