import * as Location from "expo-location";
import { supabase } from "./supabase";
import { reverseGeocodeWithNominatim, type ResolvedLocation, countryCodeToFlag } from "./geocoding";
import { logError } from "./error-logger";

// Throttle: only auto-refresh location once per hour
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
let lastRefreshTime = 0;

// ─── Request foreground location permission ────────────────
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

// ─── Check if location permission is already granted ───────
export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === "granted";
}

// ─── Get current device GPS location + reverse geocode ─────
export async function getCurrentLocation(): Promise<ResolvedLocation | null> {
  try {
    const granted = await hasLocationPermission();
    if (!granted) return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;

    // Reverse geocode to get city/state
    let city = "Unknown";
    let state = "";
    let countryCode = "";

    // Try platform reverse geocoder first
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const place = results[0];
        const resolvedCity = place.city || place.subregion;
        if (resolvedCity) {
          city = resolvedCity;
          state = place.region || "";
          countryCode = (place.isoCountryCode || "").toLowerCase();
        }
      }
    } catch {
      // Platform reverse geocoder failed — fall through
    }

    // Fallback to Nominatim
    if (city === "Unknown") {
      const nominatim = await reverseGeocodeWithNominatim(latitude, longitude);
      if (nominatim) {
        city = nominatim.city;
        state = nominatim.state;
        countryCode = nominatim.countryCode;
      }
    }

    const flag = countryCodeToFlag(countryCode);

    return {
      city,
      state,
      latitude,
      longitude,
      displayName: state ? `${city}, ${state}` : city,
      countryCode,
      flag,
    };
  } catch (err: any) {
    logError(err, { screen: "LocationService", context: "get_current_location" });
    return null;
  }
}

// ─── Silently refresh user's location in DB (throttled) ────
export async function refreshLocationIfNeeded(userId: string): Promise<void> {
  const now = Date.now();
  if (now - lastRefreshTime < REFRESH_INTERVAL_MS) return;

  try {
    const granted = await hasLocationPermission();
    if (!granted) return;

    const location = await getCurrentLocation();
    if (!location) return;

    await supabase
      .from("profiles")
      .update({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        state: location.state,
      })
      .eq("id", userId);

    lastRefreshTime = now;
  } catch (err: any) {
    logError(err, { screen: "LocationService", context: "refresh_location" });
  }
}
