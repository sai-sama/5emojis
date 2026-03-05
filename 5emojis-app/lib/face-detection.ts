import { logError } from "./error-logger";

/**
 * Detect whether a face is present in a local photo.
 * Uses Google ML Kit via @infinitered/react-native-mlkit-face-detection.
 * Runs entirely on-device — no API calls, no cost.
 *
 * Gracefully degrades: if the native module isn't available (Expo Go),
 * or if detection crashes, we fail open (allow the photo).
 */
export async function detectFaceInPhoto(
  uri: string
): Promise<{ hasFace: boolean; error?: string }> {
  try {
    const { RNMLKitFaceDetector } = require("@infinitered/react-native-mlkit-face-detection");

    const detector = new RNMLKitFaceDetector({
      performanceMode: "accurate",
      landmarkMode: false,
      contourMode: false,
      classificationMode: false,
      minFaceSize: 0.15, // face must be at least 15% of image
    });

    await detector.initialize();

    const result = await detector.detectFaces(uri);

    if (!result || !result.success) {
      // Detection failed — fail open
      console.warn("Face detection returned no result, allowing photo");
      return { hasFace: true };
    }

    if (result.faces.length === 0) {
      return {
        hasFace: false,
        error:
          "Your main photo needs to clearly show your face. Try a different photo!",
      };
    }

    return { hasFace: true };
  } catch (err: any) {
    // Native module not available (Expo Go) or crash — fail open
    console.warn("Face detection unavailable, skipping check:", err?.message);
    logError(err, { screen: "FaceDetection", context: "detect_face_in_photo" });
    return { hasFace: true };
  }
}
