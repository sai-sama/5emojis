import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Sound cache ──────────────────────────────────────────────
let matchSound: Sound | null = null;
let swipeSound: Sound | null = null;
let popSound: Sound | null = null;

// ─── Mute state ───────────────────────────────────────────────
let _muted = false;

export async function loadMuteSetting() {
  const val = await AsyncStorage.getItem("sound_muted");
  _muted = val === "true";
}

export async function setSoundMuted(muted: boolean) {
  _muted = muted;
  await AsyncStorage.setItem("sound_muted", muted ? "true" : "false");
}

export function isSoundMuted() {
  return _muted;
}

// Initialize audio mode for background-compatible playback
let audioInitialized = false;
async function ensureAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  await loadMuteSetting();
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    staysActiveInBackground: false,
  });
}

/**
 * Play a celebratory sound on match.
 */
export async function playMatchSound() {
  try {
    await ensureAudio();
    if (_muted) return;
    if (matchSound) {
      await matchSound.replayAsync();
      return;
    }
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
    if (_muted) return;
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
    if (_muted) return;
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
