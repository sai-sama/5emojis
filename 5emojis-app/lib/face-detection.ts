import { Alert } from "react-native";
import { logError } from "./error-logger";

/**
 * Detect whether a face is present in a local photo.
 * Uses Google ML Kit via @infinitered/react-native-mlkit-face-detection.
 * Runs entirely on-device — no API calls, no cost.
 *
 * If the native module isn't available or detection fails, we reject the photo
 * and ask the user to try again — we never silently allow unverified photos.
 */
export async function detectFaceInPhoto(
  uri: string
): Promise<{ hasFace: boolean; error?: string }> {
  try {
    const {
      RNMLKitFaceDetector,
    } = require("@infinitered/react-native-mlkit-face-detection");

    const detector = new RNMLKitFaceDetector({
      performanceMode: "accurate",
      landmarkMode: false,
      contourMode: false,
      classificationMode: false,
      minFaceSize: 0.15, // face must be at least 15% of image
    });

    await detector.initialize();

    // Normalize URI — ML Kit expects file:// prefix on iOS
    const normalizedUri = uri.startsWith("file://") ? uri : `file://${uri}`;
    const result = await detector.detectFaces(normalizedUri);

    if (!result) {
      return {
        hasFace: false,
        error:
          "Couldn't verify your photo. Please try a different photo with your face clearly visible.",
      };
    }

    if (!result.success) {
      return {
        hasFace: false,
        error:
          result.error ||
          "Face detection failed. Please try a different, well-lit photo showing your face.",
      };
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
    // Native module not available or crash — do NOT fail open
    logError(err, {
      screen: "FaceDetection",
      context: "detect_face_in_photo",
    });
    console.warn("Face detection error:", err?.message);
    return {
      hasFace: false,
      error:
        "Face verification isn't available right now. Please try again or use a clear selfie as your main photo.",
    };
  }
}
