import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import EmojiBackground from "../../components/EmojiBackground";

// ─── Helpers ────────────────────────────────────────────────
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

type ResolvedLocation = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

async function geocodeWithNominatim(
  input: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1&countrycodes=us`,
      { headers: { "User-Agent": "5Emojis-App/1.0" } }
    );
    const data = await response.json();
    if (data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

async function geocodeInput(input: string): Promise<ResolvedLocation | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    // Try platform geocoder first
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const results = await Location.geocodeAsync(trimmed);
      if (results.length > 0) {
        latitude = results[0].latitude;
        longitude = results[0].longitude;
      }
    } catch {
      // Platform geocoder unavailable — fall through to Nominatim
    }

    // Fallback to Nominatim if platform geocoder returned nothing
    if (latitude === undefined || longitude === undefined) {
      const nominatim = await geocodeWithNominatim(trimmed);
      if (!nominatim) return null;
      latitude = nominatim.latitude;
      longitude = nominatim.longitude;
    }

    // Reverse geocode to get structured city/state
    let city = trimmed;
    let state = "";

    try {
      const reverseResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (reverseResults.length > 0) {
        const place = reverseResults[0];
        city = place.city || place.subregion || trimmed;
        state = place.region || "";
      }
    } catch {
      // Reverse geocode failed — use input as city name
    }

    return {
      city,
      state,
      latitude,
      longitude,
      displayName: state ? `${city}, ${state}` : city,
    };
  } catch {
    return null;
  }
}

// ─── Component ──────────────────────────────────────────────
export default function LocationScreen() {
  const { data, submit, submitting } = useOnboarding();
  const [input, setInput] = useState(data.city);
  const [isNewToCity, setIsNewToCity] = useState(data.isNewToCity);

  // Geocode result state
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");

  // Debounce timer
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Validate and geocode on input change ─────────────────
  const handleInputChange = useCallback((text: string) => {
    setInput(text);
    setResolved(null);
    setGeocodeError("");

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (!trimmed) return;

    // Basic format validation for ZIP codes
    if (/^\d+/.test(trimmed) && trimmed.length >= 3) {
      // Looks like a ZIP — validate format once they've typed enough
      if (trimmed.length >= 5 && !ZIP_REGEX.test(trimmed)) {
        setGeocodeError("Enter a valid 5-digit ZIP code");
        return;
      }
    }

    // Debounce geocoding — wait for user to stop typing
    if (trimmed.length >= 3) {
      debounceRef.current = setTimeout(async () => {
        setGeocoding(true);
        const result = await geocodeInput(trimmed);
        setGeocoding(false);

        if (result) {
          setResolved(result);
          setGeocodeError("");
        } else {
          setGeocodeError("Couldn't find that location. Try a city name or ZIP code.");
        }
      }, 600);
    }
  }, []);

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!resolved) {
      // Try one more geocode attempt
      setGeocoding(true);
      const result = await geocodeInput(input.trim());
      setGeocoding(false);

      if (!result) {
        Alert.alert(
          "Location not found",
          "We couldn't find that location. Please enter a valid city name or ZIP code."
        );
        return;
      }
      setResolved(result);
      // Continue with this result
      await submitWithLocation(result);
      return;
    }

    await submitWithLocation(resolved);
  };

  const submitWithLocation = async (location: ResolvedLocation) => {
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
    router.replace("/(tabs)");
  };

  const canSubmit = input.trim().length >= 2 && !geocoding && !submitting && !geocodeError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={["bottom"]}>
      <EmojiBackground />
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 32 }}>
        <Text style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}>
          📍  Where are you?
        </Text>
        <Text style={{ fontSize: 15, fontFamily: fonts.body, color: COLORS.textSecondary, marginTop: 4, marginBottom: 32 }}>
          We'll show you people nearby.
        </Text>

        {/* Input field */}
        <TextInput
          value={input}
          onChangeText={handleInputChange}
          placeholder="City or ZIP code"
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
            borderColor: geocodeError
              ? "#FB7185"
              : resolved
              ? "#34D399"
              : input.trim()
              ? COLORS.primary
              : COLORS.border,
            marginBottom: 8,
          }}
        />

        {/* Geocode feedback */}
        <View style={{ minHeight: 28, marginBottom: 12 }}>
          {geocoding && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 14, fontFamily: fonts.body, color: COLORS.textSecondary }}>
                Finding location...
              </Text>
            </View>
          )}
          {!geocoding && resolved && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16 }}>✅</Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.bodySemiBold, color: "#059669" }}>
                {resolved.displayName}
              </Text>
            </View>
          )}
          {!geocoding && geocodeError && (
            <Text style={{ fontSize: 14, fontFamily: fonts.body, color: "#FB7185" }}>
              {geocodeError}
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
            trackColor={{ false: "#E2E8F0", true: COLORS.primary }}
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

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={{
            borderRadius: 14,
            paddingVertical: 16,
            marginBottom: 16,
            backgroundColor: canSubmit ? COLORS.primary : "#D1D5DB",
            alignItems: "center",
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: "#FFF", textAlign: "center", fontSize: 17, fontFamily: fonts.bodySemiBold }}>
              🚀  Let's go!
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
