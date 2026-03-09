import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../lib/auth-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import BrandLogo from "../../components/BrandLogo";

export default function SignIn() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [socialLoading, setSocialLoading] = useState<"apple" | "google" | null>(null);

  const isBusy = socialLoading !== null;

  const handleAppleSignIn = async () => {
    setSocialLoading("apple");
    setError("");
    const { error: err } = await signInWithApple();
    setSocialLoading(null);
    if (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading("google");
    setError("");
    const { error: err } = await signInWithGoogle();
    setSocialLoading(null);
    if (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="aurora" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
          {/* Hero branding */}
          <View style={{ alignItems: "center" }}>
            <BrandLogo size="large" showEmojis />
          </View>
          <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: 40 }}>
            Your next friend is 5 emojis away.
          </Text>

          {/* Social auth */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={{
                backgroundColor: "#000",
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 10,
                marginBottom: 12,
                opacity: socialLoading === "apple" ? 0.7 : 1,
              }}
              onPress={handleAppleSignIn}
              disabled={isBusy}
            >
              {socialLoading === "apple" ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color="#FFF" />
                  <Text style={{ color: "#FFF", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: "#FFF",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              opacity: socialLoading === "google" ? 0.7 : 1,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.08)",
            }}
            onPress={handleGoogleSignIn}
            disabled={isBusy}
          >
            {socialLoading === "google" ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <>
                <Svg width={24} height={24} viewBox="0 0 48 48">
                  <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <Path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
                  <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </Svg>
                <Text style={{ color: COLORS.text, fontSize: 17, fontFamily: fonts.bodySemiBold }}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Error */}
          {error ? (
            <Text style={{ color: COLORS.accent, fontSize: 14, fontFamily: fonts.bodyMedium, marginTop: 16, textAlign: "center" }}>
              {error}
            </Text>
          ) : null}

          {/* Legal text */}
          <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textMuted, textAlign: "center", marginTop: 24, lineHeight: 18 }}>
            By continuing, you agree to our{" "}
            <Text
              style={{ color: COLORS.primary, fontFamily: fonts.bodySemiBold, textDecorationLine: "underline" }}
              onPress={() => router.push("/terms")}
            >
              Terms of Service
            </Text>
            {" "}and{" "}
            <Text
              style={{ color: COLORS.primary, fontFamily: fonts.bodySemiBold, textDecorationLine: "underline" }}
              onPress={() => router.push("/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
