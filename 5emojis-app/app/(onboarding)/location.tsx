import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "../../lib/onboarding-context";
import { fonts } from "../../lib/fonts";
import { COLORS } from "../../lib/constants";
import {
  requestLocationPermission,
  getCurrentLocation,
} from "../../lib/location-service";
import OnboardingButton from "../../components/OnboardingButton";
import LottieCelebration from "../../components/lottie/LottieCelebration";

export default function LocationScreen() {
  const { data, submit, submitting } = useOnboarding();
  const [isNewToCity, setIsNewToCity] = useState(data.isNewToCity);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationResolved, setLocationResolved] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleEnableLocation = async () => {
    setLoading(true);
    setPermissionDenied(false);

    const granted = await requestLocationPermission();
    if (!granted) {
      setLoading(false);
      setPermissionDenied(true);
      return;
    }

    const location = await getCurrentLocation();
    setLoading(false);

    if (!location) {
      Alert.alert(
        "Couldn't get location",
        "Please make sure location services are enabled and try again."
      );
      return;
    }

    setResolvedLocation({
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setDisplayName(location.displayName);
    setLocationResolved(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSubmit = async () => {
    if (!resolvedLocation) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { error } = await submit({
      city: resolvedLocation.city,
      state: resolvedLocation.state,
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
      isNewToCity,
    });

    if (error) {
      Alert.alert("Oops", error);
      return;
    }

    setShowCelebration(true);
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 1800);
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 110, paddingBottom: 16 }}>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(100)}
          style={{ fontSize: 28, fontFamily: fonts.heading, color: COLORS.text }}
        >
          {locationResolved ? "Got you!" : "Where are you?"}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(500).delay(200)}
          style={{
            fontSize: 15,
            fontFamily: fonts.body,
            color: COLORS.textSecondary,
            marginTop: 4,
            marginBottom: 32,
          }}
        >
          {locationResolved
            ? "We'll use your location to show you people nearby."
            : "We need your location to show you people nearby."}
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {!locationResolved ? (
            <>
              {/* Enable Location button */}
              <TouchableOpacity
                onPress={handleEnableLocation}
                disabled={loading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.primary,
                  borderRadius: 14,
                  paddingVertical: 16,
                  gap: 10,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name="navigate" size={20} color="#FFF" />
                )}
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: fonts.bodySemiBold,
                    color: "#FFF",
                  }}
                >
                  {loading ? "Finding you..." : "Enable Location"}
                </Text>
              </TouchableOpacity>

              {/* Permission denied state */}
              {permissionDenied && (
                <View style={{ marginTop: 16 }}>
                  <View
                    style={{
                      backgroundColor: "#FEF2F2",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#FECACA",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: fonts.bodyBold,
                        color: "#DC2626",
                        marginBottom: 6,
                      }}
                    >
                      Location access required
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.body,
                        color: "#7F1D1D",
                        lineHeight: 18,
                        marginBottom: 12,
                      }}
                    >
                      5Emojis needs your location to find people near you. Please
                      enable location access in your device settings.
                    </Text>
                    <TouchableOpacity
                      onPress={openSettings}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons name="settings-outline" size={16} color={COLORS.primary} />
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: fonts.bodySemiBold,
                          color: COLORS.primary,
                        }}
                      >
                        Open Settings
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Privacy note */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 20,
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons name="shield-checkmark" size={16} color={COLORS.textMuted} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontFamily: fonts.body,
                    color: COLORS.textMuted,
                    lineHeight: 18,
                  }}
                >
                  Your exact location is never shared. We only use it to find
                  people in your area.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Location confirmed */}
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: COLORS.vibe,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.primarySurface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.vibe} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontFamily: fonts.headingBold,
                      color: COLORS.text,
                    }}
                  >
                    {displayName}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.body,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Your location is set
                  </Text>
                </View>
              </View>

              {/* Retry */}
              <TouchableOpacity
                onPress={handleEnableLocation}
                style={{ alignItems: "center", marginTop: 12 }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.bodySemiBold,
                    color: COLORS.primary,
                  }}
                >
                  Not right? Refresh location
                </Text>
              </TouchableOpacity>

              {/* New to city toggle */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: COLORS.surface,
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: isNewToCity ? COLORS.primary : COLORS.border,
                  marginTop: 20,
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bodyBold, color: COLORS.text }}>
                    New to this city?
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: fonts.body,
                      color: COLORS.textSecondary,
                      marginTop: 2,
                    }}
                  >
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
            </>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        {locationResolved && (
          <View style={{ paddingBottom: 0, paddingTop: 8 }}>
            <OnboardingButton
              disabled={submitting}
              loading={submitting}
              label="Let's go!"
              onPress={handleSubmit}
            />
          </View>
        )}
      </View>

      {showCelebration && <LottieCelebration />}
    </SafeAreaView>
  );
}
