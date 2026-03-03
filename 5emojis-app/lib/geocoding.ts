import * as Location from "expo-location";
import { logError } from "./error-logger";

// ─── Types ───────────────────────────────────────────────────
export type ResolvedLocation = {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  displayName: string;
  countryCode: string;
  flag: string;
};

// ─── Country code → flag emoji ───────────────────────────────
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) + 0x1f1e6 - 65,
    upper.charCodeAt(1) + 0x1f1e6 - 65
  );
}

// ─── Nominatim forward geocode (single) ──────────────────────
async function geocodeWithNominatim(
  input: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "5Emojis-App/1.0" } }
    );
    const data = await response.json();
    if (data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch (err: any) {
    logError(err, { screen: "Geocoding", context: "geocode_with_nominatim" });
    return null;
  }
}

// ─── Nominatim reverse geocode ───────────────────────────────
async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number
): Promise<{ city: string; state: string; countryCode: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      { headers: { "User-Agent": "5Emojis-App/1.0" } }
    );
    const data = await response.json();
    if (!data.address) return null;

    const addr = data.address;
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const state = addr.state || addr.region || "";
    const countryCode = addr.country_code || "";

    return city ? { city, state, countryCode } : null;
  } catch (err: any) {
    logError(err, { screen: "Geocoding", context: "reverse_geocode_with_nominatim" });
    return null;
  }
}

// ─── Search locations (multiple results for dropdown) ────────
// Returns up to 5 suggestions from Nominatim with structured data.
export async function searchLocations(
  input: string
): Promise<ResolvedLocation[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`,
      { headers: { "User-Agent": "5Emojis-App/1.0" } }
    );
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    // Deduplicate by city+state+country to avoid showing the same place twice
    const seen = new Set<string>();

    return data
      .map((item: any) => {
        const addr = item.address || {};
        const city =
          addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
        const state = addr.state || addr.region || "";
        const cc = (addr.country_code || "").toLowerCase();

        if (!city) return null;

        const key = `${city}|${state}|${cc}`;
        if (seen.has(key)) return null;
        seen.add(key);

        const flag = countryCodeToFlag(cc);
        return {
          city,
          state,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName: state ? `${city}, ${state}` : city,
          countryCode: cc,
          flag,
        } satisfies ResolvedLocation;
      })
      .filter((r): r is ResolvedLocation => r !== null);
  } catch (err: any) {
    logError(err, { screen: "Geocoding", context: "search_locations" });
    return [];
  }
}

// ─── Main geocode function (single result, used as fallback) ─
// Tries platform geocoder first, falls back to Nominatim.
// Then reverse geocodes to get structured city/state.
export async function geocodeInput(
  input: string
): Promise<ResolvedLocation | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    let latitude: number | undefined;
    let longitude: number | undefined;

    // 1. Try platform geocoder
    try {
      const results = await Location.geocodeAsync(trimmed);
      if (results.length > 0) {
        latitude = results[0].latitude;
        longitude = results[0].longitude;
      }
    } catch (err: any) {
      // Platform geocoder unavailable — fall through
      logError(err, { screen: "Geocoding", context: "platform_geocoder" });
    }

    // 2. Fallback to Nominatim
    if (latitude === undefined || longitude === undefined) {
      const nominatim = await geocodeWithNominatim(trimmed);
      if (!nominatim) return null;
      latitude = nominatim.latitude;
      longitude = nominatim.longitude;
    }

    // 3. Reverse geocode to get structured city/state/country
    let city = trimmed;
    let state = "";
    let countryCode = "";

    // Try platform reverse geocoder first
    try {
      const reverseResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (reverseResults.length > 0) {
        const place = reverseResults[0];
        const resolvedCity = place.city || place.subregion;
        if (resolvedCity) {
          city = resolvedCity;
          state = place.region || "";
          countryCode = (place.isoCountryCode || "").toLowerCase();
        }
      }
    } catch (err: any) {
      // Platform reverse geocoder failed — fall through
      logError(err, { screen: "Geocoding", context: "platform_reverse_geocoder" });
    }

    // If city is still the raw input (platform reverse geocode didn't help),
    // try Nominatim reverse geocode
    if (city === trimmed) {
      const nominatimReverse = await reverseGeocodeWithNominatim(
        latitude,
        longitude
      );
      if (nominatimReverse) {
        city = nominatimReverse.city;
        state = nominatimReverse.state;
        countryCode = nominatimReverse.countryCode;
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
    logError(err, { screen: "Geocoding", context: "geocode_input" });
    return null;
  }
}
