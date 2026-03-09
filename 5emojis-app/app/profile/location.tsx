import { useState, useMemo } from "react";
import {
  View,
  Text,
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
  requestLocationPermission,
  getCurrentLocation,
} from "../../lib/location-service";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";

export default function LocationScreen() {
  const { session } = useAuth();
  const { profile, refresh } = useProfile();
  const [gpsLoading, setGpsLoading] = useState(false);

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

  // ─── Refresh GPS location ───────────────────────────────────
  const handleRefreshLocation = async () => {
    if (!session?.user) return;
    setGpsLoading(true);
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert(
        "Location Access Needed",
        "Please enable location access in your device settings."
      );
      setGpsLoading(false);
      return;
    }

    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert("Couldn't get location", "Please try again.");
      setGpsLoading(false);
      return;
    }

    const { error } = await updateLocation(session.user.id, {
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    setGpsLoading(false);

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
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current location card */}
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationCity}>{locationDisplay}</Text>
              <Text style={styles.locationSub}>Based on your device location</Text>
            </View>
          </View>

          {/* Refresh button */}
          <TouchableOpacity
            onPress={handleRefreshLocation}
            disabled={gpsLoading}
            style={styles.refreshButton}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="navigate" size={16} color={COLORS.primary} />
            )}
            <Text style={styles.refreshButtonText}>
              {gpsLoading ? "Updating..." : "Refresh Location"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info note */}
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            Your location updates automatically when you open the app. Use refresh
            if you've moved since then.
          </Text>
        </View>

        {/* New to city */}
        <Pressable
          style={[styles.toggleRow, isNewToCity && styles.toggleRowActive]}
          onPress={toggleNewToCity}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>New to this city?</Text>
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
    gap: 12,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  locationCity: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: COLORS.text,
  },
  locationSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: COLORS.primary,
  },

  // Info
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body,
    color: COLORS.textMuted,
    lineHeight: 18,
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
