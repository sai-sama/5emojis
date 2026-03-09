import { logError } from "./error-logger";

/**
 * Detect whether a face is present in a local photo.
 * Uses Google ML Kit via @infinitered/react-native-mlkit-face-detection.
 * Runs entirely on-device — no API calls, no cost.
 *
 * If the native module isn't available or detection fails, we FAIL OPEN
 * (allow the photo) — content moderation on upload is the real safety net.
 */
export async function detectFaceInPhoto(
  uri: string
): Promise<{ hasFace: boolean; error?: string }> {
  try {
    const {
      RNMLKitFaceDetector,
    } = require("@infinitered/react-native-mlkit-face-detection");

    const detector = new RNMLKitFaceDetector({
      performanceMode: "fast",
      landmarkMode: false,
      contourMode: false,
      classificationMode: false,
      minFaceSize: 0.01, // very lenient — accept any visible human face
    });

    await detector.initialize();

    // Normalize URI — ML Kit expects file:// prefix on iOS
    const normalizedUri = uri.startsWith("file://") ? uri : `file://${uri}`;
    const result = await detector.detectFaces(normalizedUri);

    // Detection ran but returned no usable result — fail open
    if (!result || !result.success) {
      console.warn("Face detection inconclusive, allowing photo");
      return { hasFace: true };
    }

    // Only reject when ML Kit explicitly found zero faces
    if (result.faces.length === 0) {
      return {
        hasFace: false,
        error:
          "We couldn't detect a person in this photo. Try a different photo that shows you more clearly!",
      };
    }

    return { hasFace: true };
  } catch (err: any) {
    // Fail open on all errors — content moderation on upload is the real safety net
    logError(err, {
      screen: "FaceDetection",
      context: "detect_face_in_photo",
    });
    console.warn("Face detection failed, allowing photo:", err?.message);
    return { hasFace: true };
  }
}
