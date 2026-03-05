import { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { useProfile } from "../../lib/profile-context";
import {
  updateLocation,
  updateProfileFields,
} from "../../lib/profile-service";
import {
  searchLocations,
  type ResolvedLocation,
} from "../../lib/geocoding";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function LocationScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [saving, setSaving] = useState(false);

  // Location search
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local state
  const [isNewToCity, setIsNewToCity] = useState(
    profile?.profile.is_new_to_city ?? false
  );

  const locationDisplay = useMemo(() => {
    if (!profile) return "";
    return profile.profile.state
      ? `${profile.profile.city}, ${profile.profile.state}`
      : profile.profile.city;
  }, [profile]);

  if (!profile) return null;

  // ─── Location search ───────────────────────────────────────
  const handleLocationInput = useCallback((text: string) => {
    setLocationInput(text);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return;

    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      const results = await searchLocations(trimmed);
      setGeocoding(false);
      setSuggestions(results);
    }, 600);
  }, []);

  const selectSuggestion = async (location: ResolvedLocation) => {
    if (!session?.user) return;
    setSuggestions([]);
    setSaving(true);

    const { error } = await updateLocation(session.user.id, {
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    setSaving(false);
    setEditingLocation(false);
    setLocationInput("");

    if (error) {
      Alert.alert("Error", error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refresh();
    }
  };

  // ─── New to city toggle ────────────────────────────────────
  const toggleNewToCity = async () => {
    if (!session?.user) return;
    const next = !isNewToCity;
    setIsNewToCity(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfileFields(session.user.id, { is_new_to_city: next });
    refresh();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location</Text>
        <View style={{ width: 32 }}>
          {saving && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current location */}
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Text style={{ fontSize: 20 }}>📍</Text>
            <Text style={styles.locationCity}>{locationDisplay}</Text>
            <TouchableOpacity
              hitSlop={12}
              onPress={() => {
                setEditingLocation(!editingLocation);
                setLocationInput("");
                setSuggestions([]);
              }}
            >
              <Text style={styles.changeText}>
                {editingLocation ? "Cancel" : "Change"}
              </Text>
            </TouchableOpacity>
          </View>

          {editingLocation && (
            <View style={{ marginTop: 12 }}>
              <TextInput
                value={locationInput}
                onChangeText={handleLocationInput}
                placeholder="Enter city or postal code"
                placeholderTextColor="#B2BEC3"
                autoFocus
                autoCapitalize="words"
                style={styles.textInput}
              />

              {geocoding && (
                <View style={styles.searchingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.searchingText}>Finding locations...</Text>
                </View>
              )}

              {!geocoding && suggestions.length > 0 && (
                <View style={styles.suggestionList}>
                  {suggestions.map((loc, i) => (
                    <TouchableOpacity
                      key={`${loc.latitude}-${loc.longitude}`}
                      onPress={() => selectSuggestion(loc)}
                      style={[
                        styles.suggestionRow,
                        i > 0 && styles.suggestionBorder,
                      ]}
                    >
                      <Text style={{ fontSize: 20 }}>{loc.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionCity}>{loc.city}</Text>
                        {loc.state ? (
                          <Text style={styles.suggestionState}>{loc.state}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* New to city */}
        <Pressable
          style={[styles.toggleRow, isNewToCity && styles.toggleRowActive]}
          onPress={toggleNewToCity}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>🆕  New to this city?</Text>
            <Text style={styles.toggleSub}>
              Show a badge so locals know you're looking to meet people
            </Text>
          </View>
          <View style={[styles.toggleDot, isNewToCity && styles.toggleDotActive]}>
            {isNewToCity && <Text style={{ fontSize: 10 }}>✓</Text>}
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: "300",
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },

  // Location card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationCity: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  changeText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  searchingText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },
  suggestionList: {
    marginTop: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  suggestionBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionCity: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.text,
  },
  suggestionState: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  toggleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: COLORS.text,
  },
  toggleSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  toggleDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
