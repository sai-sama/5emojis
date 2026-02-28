// Emoji name lookup — delegates to emoji-data.ts which uses the full
// @emoji-mart/data set (1,870+ emojis with names and keywords).
import { getEmojiDisplayName } from "../lib/emoji-data";

export function getEmojiName(emoji: string): string | null {
  return getEmojiDisplayName(emoji);
}
