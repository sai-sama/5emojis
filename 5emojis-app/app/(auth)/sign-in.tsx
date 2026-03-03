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
import { useAuth } from "../../lib/auth-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import EmojiBackground from "../../components/EmojiBackground";
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

  const isBusy = loading || socialLoading !== null;

  if (confirmationSent) {
    return (
      <View style={{ flex: 1 }}>
        <AuroraBackground variant="aurora" />
        <EmojiBackground />
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
              onPress={() => {
                setConfirmationSent(false);
                setMode("sign-in");
              }}
              style={{ marginTop: 32 }}
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
      <EmojiBackground />
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

          {/* Social auth — prominent, Tinder/Bumble style */}
          {/* TODO: Re-enable Apple Sign-In once Apple Developer account is active */}

          <TouchableOpacity
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: COLORS.border,
              marginBottom: 4,
              opacity: socialLoading === "google" ? 0.7 : 1,
            }}
            onPress={handleGoogleSignIn}
            disabled={isBusy}
          >
            {socialLoading === "google" ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={{ color: COLORS.text, fontSize: 17, fontFamily: fonts.bodySemiBold }}>
                Continue with Google
              </Text>
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
            placeholderTextColor="#B2BEC3"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              marginBottom: 12,
            }}
          />

          {/* Password */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#B2BEC3"
            secureTextEntry
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              marginBottom: mode === "sign-up" ? 12 : 8,
            }}
          />

          {/* Confirm password — sign-up only */}
          {mode === "sign-up" && (
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#B2BEC3"
              secureTextEntry
              autoComplete="new-password"
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                fontFamily: fonts.body,
                color: COLORS.text,
                borderWidth: 1.5,
                borderColor: COLORS.border,
                marginBottom: 8,
              }}
            />
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
            onPress={handleSubmit}
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
                {mode === "sign-up" ? "Create Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms — sign-up only */}
          {mode === "sign-up" && (
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

          <View style={{ height: 32 }} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
