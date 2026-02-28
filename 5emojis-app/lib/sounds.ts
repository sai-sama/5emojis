import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";

// ─── Sound cache ──────────────────────────────────────────────
let matchSound: Sound | null = null;
let swipeSound: Sound | null = null;
let popSound: Sound | null = null;

// Initialize audio mode for background-compatible playback
let audioInitialized = false;
async function ensureAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
  });
}

// ─── Generate simple tones using Expo AV ─────────────────────
// Since we don't have sound files yet, we'll create a system
// that plays haptic-like audio feedback using basic parameters.
// Replace these with actual .mp3/.wav files when ready.

/**
 * Play a celebratory sound on match.
 * TODO: Replace with a custom chime sound file.
 * For now, uses a system-compatible approach.
 */
export async function playMatchSound() {
  try {
    await ensureAudio();
    if (matchSound) {
      await matchSound.replayAsync();
      return;
    }
    // Placeholder — will be replaced with actual sound file
    // Create a simple ascending tone sequence
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/match.mp3"),
      { shouldPlay: true, volume: 0.7 }
    );
    matchSound = sound;
  } catch {
    // Sound file not found — silently skip
  }
}

/**
 * Play a swoosh on swipe.
 */
export async function playSwipeSound() {
  try {
    await ensureAudio();
    if (swipeSound) {
      await swipeSound.replayAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/swipe.mp3"),
      { shouldPlay: true, volume: 0.4 }
    );
    swipeSound = sound;
  } catch {
    // Sound file not found — silently skip
  }
}

/**
 * Play a pop on emoji select.
 */
export async function playPopSound() {
  try {
    await ensureAudio();
    if (popSound) {
      await popSound.replayAsync();
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/pop.mp3"),
      { shouldPlay: true, volume: 0.5 }
    );
    popSound = sound;
  } catch {
    // Sound file not found — silently skip
  }
}

/**
 * Cleanup all loaded sounds — call on app unmount.
 */
export async function unloadSounds() {
  if (matchSound) { await matchSound.unloadAsync(); matchSound = null; }
  if (swipeSound) { await swipeSound.unloadAsync(); swipeSound = null; }
  if (popSound) { await popSound.unloadAsync(); popSound = null; }
}
