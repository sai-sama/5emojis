import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import {
  searchLocations,
  geocodeInput,
  type ResolvedLocation,
} from "../../lib/geocoding";
import OnboardingButton from "../../components/OnboardingButton";
import LottieCelebration from "../../components/lottie/LottieCelebration";

// ─── Component ──────────────────────────────────────────────
export default function LocationScreen() {
  const { data, submit, submitting } = useOnboarding();
  const [input, setInput] = useState(data.city);
  const [isNewToCity, setIsNewToCity] = useState(data.isNewToCity);
  const [showCelebration, setShowCelebration] = useState(false);

  // Search state
  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [selected, setSelected] = useState<ResolvedLocation | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Search on input change ────────────────────────────────
  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    setSelected(null);
    setSuggestions([]);
    setSearchError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchLocations(trimmed);
      setSearching(false);

      if (results.length > 0) {
        setSuggestions(results);
      } else {
        setSearchError("Couldn't find that location. Try a city name or postal code.");
      }
    }, 600);
  }, []);

  // ─── Select a suggestion ──────────────────────────────────
  const handleSelect = useCallback((location: ResolvedLocation) => {
    setSelected(location);
    setSuggestions([]);
    setInput(location.displayName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    let location = selected;

    if (!location) {
      // Try a direct geocode as fallback
      setSearching(true);
      location = await geocodeInput(input.trim());
      setSearching(false);

      if (!location) {
        Alert.alert(
          "Location not found",
          "We couldn't find that location. Please enter a valid city name or postal code."
        );
        return;
      }
      setSelected(location);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { error } = await submit({
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
      isNewToCity,
    });

    if (error) {
      Alert.alert("Oops", error);
      return;
    }

    // Show celebration confetti before navigating
    setShowCelebration(true);
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 1800);
  };

  const canSubmit = input.trim().length >= 2 && !searching && !submitting && !searchError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 110 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          📍  Where are you?
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}
        >
          We'll show you people nearby.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {/* Input field */}
          <TextInput
            value={input}
            onChangeText={handleInputChange}
            placeholder="City or postal code"
            placeholderTextColor="#B2BEC3"
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              fontFamily: fonts.body,
              color: COLORS.text,
              borderWidth: 1.5,
              borderColor: searchError
                ? COLORS.pass
                : selected
                ? COLORS.vibe
                : input.trim()
                ? COLORS.primary
                : COLORS.border,
              marginBottom: 8,
            }}
          />

          {/* Search feedback & suggestions */}
          <View style={{ marginBottom: 12 }}>
            {searching && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={{ fontSize: 14, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                  Finding locations...
                </Text>
              </View>
            )}

            {!searching && suggestions.length > 0 && (
              <View style={{
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                overflow: "hidden",
              }}>
                {suggestions.map((loc, i) => (
                  <TouchableOpacity
                    key={`${loc.latitude}-${loc.longitude}`}
                    onPress={() => handleSelect(loc)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      gap: 10,
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderTopColor: COLORS.border,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{loc.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontFamily: fonts.bodySemiBold, color: COLORS.text }}>
                        {loc.city}
                      </Text>
                      {loc.state ? (
                        <Text style={{ fontSize: 13, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                          {loc.state}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!searching && selected && suggestions.length === 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 28 }}>
                <Text style={{ fontSize: 16 }}>{selected.flag || "✅"}</Text>
                <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: COLORS.vibeDark }}>
                  {selected.displayName}
                </Text>
              </View>
            )}

            {!searching && searchError && (
              <Text style={{ fontSize: 14, fontFamily: fonts.body, color: COLORS.pass, minHeight: 28 }}>
                {searchError}
              </Text>
            )}
          </View>

          {/* New to city toggle */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.surface,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1.5,
            borderColor: isNewToCity ? COLORS.primary : COLORS.border,
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.bodyBold, color: COLORS.text }}>
                🆕  New to this city?
              </Text>
              <Text style={{ fontSize: 13, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 2 }}>
                Get a badge so locals know you're looking to meet people
              </Text>
            </View>
            <Switch
              value={isNewToCity}
              onValueChange={(value) => {
                setIsNewToCity(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: COLORS.borderLight, true: COLORS.primary }}
            />
          </View>

          {isNewToCity && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
            }}>
              <Text style={{ fontSize: 20 }}>🎉</Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                Welcome! Locals love meeting new people.
              </Text>
            </View>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingBottom: 0, paddingTop: 8 }}>
          <OnboardingButton
            disabled={!canSubmit}
            loading={submitting}
            label="🚀  Let's go!"
            onPress={handleSubmit}
          />
        </View>
      </View>
      </KeyboardAvoidingView>

      {showCelebration && <LottieCelebration />}
    </SafeAreaView>
  );
}
