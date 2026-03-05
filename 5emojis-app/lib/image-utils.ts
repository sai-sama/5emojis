import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";
import { logError } from "./error-logger";
import { detectFaceInPhoto } from "./face-detection";

// ─── Constants ──────────────────────────────────────────────
const MAX_WIDTH = 800; // 2x retina for ~400px card width
const JPEG_QUALITY = 0.7;
const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

// ─── Compress ───────────────────────────────────────────────
/** Check if expo-image-manipulator native module is available (dev build only). */
function hasImageManipulator(): boolean {
  try {
    const { requireOptionalNativeModule } = require("expo-modules-core");
    return !!requireOptionalNativeModule("ExpoImageManipulator");
  } catch (err: any) {
    logError(err, { screen: "ImageUtils", context: "check_image_manipulator" });
    return false;
  }
}

/** Resize to max 800px wide + JPEG compress. Returns new local URI.
 *  Falls back to original URI if native module isn't available. */
export async function compressPhoto(uri: string): Promise<string> {
  if (!hasImageManipulator()) {
    // Native module not available (Expo Go) — use original URI.
    // ImagePicker already applies quality: 0.6 + crop, so this is acceptable.
    console.warn("expo-image-manipulator not available, skipping compression");
    return uri;
  }

  try {
    const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: JPEG_QUALITY, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (err: any) {
    console.warn("Image compression failed, using original");
    logError(err, { screen: "ImageUtils", context: "compress_photo" });
    return uri;
  }
}

// ─── Validate size ──────────────────────────────────────────
/** Returns file size in KB. Throws if over 1.5 MB. */
export async function validatePhotoSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error("Photo file not found");
  const sizeKB = Math.round((info.size ?? 0) / 1024);
  if ((info.size ?? 0) > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Photo is too large (${sizeKB} KB). Please choose a smaller image.`
    );
  }
  return sizeKB;
}

// ─── Content moderation ─────────────────────────────────────
type ModerationResult = { safe: boolean; reason?: string };

/**
 * Send compressed photo to Supabase Edge Function for NSFW check.
 * Uses OpenAI omni-moderation-latest (free endpoint).
 *
 * Only blocks:
 *  - sexual content with score > 0.8 (explicit nudity)
 *  - sexual/minors at any score
 *  - violence/graphic
 *  - self-harm
 */
export async function moderatePhoto(
  base64: string
): Promise<ModerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("moderate-photo", {
      body: { image: base64 },
    });

    if (error) {
      // If moderation service is down, allow the upload (fail open for UX).
      // The photo can be reviewed manually later via the reports system.
      console.warn("Moderation service error, allowing upload:", error.message);
      return { safe: true };
    }

    return data as ModerationResult;
  } catch (err: any) {
    // Network error — fail open
    console.warn("Moderation network error, allowing upload");
    logError(err, { screen: "ImageUtils", context: "moderate_photo" });
    return { safe: true };
  }
}

// ─── Full pipeline ──────────────────────────────────────────
/**
 * Compress → validate size → moderate.
 * Returns { uri, base64 } if everything passes.
 * Throws with a user-friendly message on failure.
 *
 * base64 is reused for the Supabase Storage upload — avoids the
 * unreliable fetch(localUri).blob() pattern in React Native.
 */
export async function preparePhoto(
  uri: string,
  isPrimary: boolean = false
): Promise<{ uri: string; base64: string }> {
  // 1. Compress (gracefully degrades if native module missing)
  const compressedUri = await compressPhoto(uri);

  // 2. Validate file size
  await validatePhotoSize(compressedUri);

  // 3. Face detection (primary photo only — must show a clear face)
  if (isPrimary) {
    const faceResult = await detectFaceInPhoto(compressedUri);
    if (!faceResult.hasFace) {
      throw new Error(
        faceResult.error ||
          "Your main photo needs to clearly show your face. Try a different photo!"
      );
    }
  }

  // 4. Read as base64 (reused for both moderation AND upload)
  const base64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  });

  // 5. Content moderation
  const modResult = await moderatePhoto(base64);
  if (!modResult.safe) {
    throw new Error(
      modResult.reason ||
        "This photo doesn't meet our community guidelines. Please choose a different one."
    );
  }

  return { uri: compressedUri, base64 };
}
