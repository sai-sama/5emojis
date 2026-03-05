import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import AuroraBackground from "../../components/skia/AuroraBackground";
import BrandLogo from "../../components/BrandLogo";

export default function SignIn() {
  const { signIn, signUp, signInWithApple, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"apple" | "google" | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setError("");
    setLoading(true);

    if (mode === "sign-up") {
      const { error: err, needsConfirmation } = await signUp(trimmedEmail, password);
      setLoading(false);
      if (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err);
      } else if (needsConfirmation) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setConfirmationSent(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    } else {
      const { error: err } = await signIn(trimmedEmail, password);
      setLoading(false);
      if (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    }
  };

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

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Enter your email above, then tap reset.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setForgotPasswordSent(true);
    }
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });
    setResending(false);
    if (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const isBusy = loading || socialLoading !== null;

  if (confirmationSent) {
    return (
      <View style={{ flex: 1 }}>
        <AuroraBackground variant="aurora" />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 56 }}>📬</Text>
            <Text style={{ fontSize: 24, fontFamily: fonts.heading, color: COLORS.text, marginTop: 16, textAlign: "center" }}>
              Check your email!
            </Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 8, textAlign: "center", lineHeight: 22 }}>
              We sent a confirmation link to{"\n"}
              <Text style={{ fontFamily: fonts.bodyBold, color: COLORS.primary }}>{email.trim()}</Text>
            </Text>
            <TouchableOpacity
              onPress={handleResendConfirmation}
              disabled={resending}
              style={{ marginTop: 32, opacity: resending ? 0.6 : 1 }}
            >
              <Text style={{ color: COLORS.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 15 }}>
                {resending ? "Resending..." : "Didn't get it? Resend"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setConfirmationSent(false);
                setMode("sign-in");
              }}
              style={{ marginTop: 16 }}
            >
              <Text style={{ color: COLORS.primary, fontFamily: fonts.bodySemiBold, fontSize: 16 }}>
                Already confirmed? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="aurora" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero branding */}
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 8 }}>
            👋🎉🌟💜🤝
          </Text>
          <View style={{ alignItems: "center" }}>
            <BrandLogo size="large" />
          </View>
          <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, textAlign: "center", marginBottom: 32 }}>
            Stop overthinking your first message.{"\n"}Just send 5 emojis.
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
                marginBottom: 10,
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
              marginBottom: 4,
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

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontFamily: fonts.bodyMedium, marginHorizontal: 16 }}>
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9B9B9B"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={{
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.4)",
              marginBottom: 12,
            }}
          />

          {/* Password */}
          {!forgotPasswordMode && (
            <View style={{ position: "relative", marginBottom: mode === "sign-up" ? 12 : 4 }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9B9B9B"
                secureTextEntry={!showPassword}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingRight: 48,
                  paddingVertical: 14,
                  fontSize: 16,
                  fontFamily: fonts.body,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.4)",
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Forgot password link — sign-in only */}
          {mode === "sign-in" && !forgotPasswordMode && (
            <TouchableOpacity onPress={() => { setForgotPasswordMode(true); setError(""); }} style={{ alignSelf: "flex-end", marginBottom: 8 }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, fontFamily: fonts.bodyMedium }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {/* Forgot password sent confirmation */}
          {forgotPasswordMode && forgotPasswordSent && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 14, padding: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.body, color: COLORS.text, textAlign: "center", lineHeight: 20 }}>
                Reset link sent to{" "}
                <Text style={{ fontFamily: fonts.bodyBold, color: COLORS.primary }}>{email.trim()}</Text>
                {"\n"}Check your inbox.
              </Text>
            </View>
          )}

          {/* Confirm password — sign-up only */}
          {mode === "sign-up" && (
            <View style={{ position: "relative", marginBottom: 8 }}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#9B9B9B"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingRight: 48,
                  paddingVertical: 14,
                  fontSize: 16,
                  fontFamily: fonts.body,
                  color: COLORS.text,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.4)",
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Error */}
          {error ? (
            <Text style={{ color: COLORS.accent, fontSize: 14, fontFamily: fonts.bodyMedium, marginBottom: 8, textAlign: "center" }}>
              {error}
            </Text>
          ) : (
            <View style={{ height: 22 }} />
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={forgotPasswordMode ? handleForgotPassword : handleSubmit}
            disabled={isBusy}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 16,
              opacity: isBusy ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
                {forgotPasswordMode ? "Send Reset Link" : mode === "sign-up" ? "Create Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to sign-in from forgot password */}
          {forgotPasswordMode && (
            <TouchableOpacity
              onPress={() => { setForgotPasswordMode(false); setForgotPasswordSent(false); setError(""); }}
              style={{ paddingVertical: 8, marginBottom: 8 }}
            >
              <Text style={{ textAlign: "center", color: COLORS.primary, fontSize: 15, fontFamily: fonts.bodySemiBold }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          )}

          {/* Terms — sign-up only */}
          {mode === "sign-up" && !forgotPasswordMode && (
            <Text style={{ fontSize: 12, fontFamily: fonts.body, color: COLORS.textSecondary, textAlign: "center", lineHeight: 18, marginBottom: 8 }}>
              By creating an account, you agree to our{" "}
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
          )}

          {/* Toggle mode */}
          {!forgotPasswordMode && (
            <TouchableOpacity
              onPress={() => {
                setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                setError("");
                setConfirmPassword("");
              }}
              style={{ paddingVertical: 8 }}
            >
              <Text style={{ textAlign: "center", color: COLORS.textSecondary, fontSize: 15, fontFamily: fonts.body }}>
                {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: COLORS.primary, fontFamily: fonts.bodySemiBold }}>
                  {mode === "sign-in" ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
