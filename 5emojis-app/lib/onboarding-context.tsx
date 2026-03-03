import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";
import { preparePhoto } from "./image-utils";
import { decode } from "base64-arraybuffer";

export type OnboardingData = {
  name: string;
  dob: Date | null;
  gender: "male" | "female" | "nonbinary";
  photos: string[]; // local URIs
  emojis: string[];
  profession: string;
  lifeStage: string;
  friendshipStyles: string[];
  interests: string[];
  availability: string[];
  personalityType: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isNewToCity: boolean;
};

const EMPTY: OnboardingData = {
  name: "",
  dob: null,
  gender: "male",
  photos: [],
  emojis: [],
  profession: "",
  lifeStage: "",
  friendshipStyles: [],
  interests: [],
  availability: [],
  personalityType: "",
  preferredAgeMin: 18,
  preferredAgeMax: 99,
  city: "",
  state: "",
  latitude: 0,
  longitude: 0,
  isNewToCity: false,
};

type OnboardingContextType = {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  submit: (finalFields?: Partial<OnboardingData>) => Promise<{ error: string | null }>;
  submitting: boolean;
};

const OnboardingContext = createContext<OnboardingContextType>({
  data: EMPTY,
  update: () => {},
  submit: async () => ({ error: null }),
  submitting: false,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { session, completeOnboarding } = useAuth();
  const [data, setData] = useState<OnboardingData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const submit = useCallback(async (finalFields?: Partial<OnboardingData>): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: "Not authenticated" };
    const userId = session.user.id;

    // Merge any last-second fields (e.g. city from location screen)
    const final = finalFields ? { ...data, ...finalFields } : data;

    // ── Age gate: must be 18+ ──────────────────────────────────
    if (!final.dob) return { error: "Date of birth is required" };
    const today = new Date();
    let age = today.getFullYear() - final.dob.getFullYear();
    const m = today.getMonth() - final.dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < final.dob.getDate())) age--;
    if (age < 18) return { error: "You must be 18 or older to use 5Emojis" };

    setSubmitting(true);
    try {
      // Location is already geocoded by the location screen
      const { latitude, longitude } = final;

      // 1. Compress, validate, moderate, then upload photos
      const photoUrls: string[] = [];
      for (let i = 0; i < final.photos.length; i++) {
        // Compress + validate size + content moderation
        let prepared: { uri: string; base64: string };
        try {
          prepared = await preparePhoto(final.photos[i]);
        } catch (err: any) {
          // Moderation or size rejection — skip this photo
          console.warn(`Photo ${i + 1} rejected:`, err.message);
          continue;
        }

        const path = `${userId}/${Date.now()}_${i}.jpg`;

        // decode base64 → ArrayBuffer (reliable in React Native,
        // unlike fetch(localUri).blob() which often silently fails)
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, decode(prepared.base64), { contentType: "image/jpeg" });

        if (uploadError) {
          console.error(`Photo ${i + 1} upload failed:`, uploadError.message, uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Fail if zero photos uploaded successfully
      if (photoUrls.length === 0 && final.photos.length > 0) {
        setSubmitting(false);
        return { error: "Photo upload failed. Please check your connection and try again." };
      }

      // 2. Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name: final.name,
        dob: final.dob.toISOString().split("T")[0],
        gender: final.gender,
        profession: final.profession || null,
        life_stage: final.lifeStage || null,
        friendship_style: final.friendshipStyles[0] || null,
        personality_type: final.personalityType || null,
        preferred_age_min: final.preferredAgeMin,
        preferred_age_max: final.preferredAgeMax,
        is_new_to_city: final.isNewToCity,
        city: final.city,
        state: final.state || null,
        latitude,
        longitude,
        search_radius_miles: 25,
      });

      if (profileError) {
        setSubmitting(false);
        return { error: profileError.message };
      }

      // 3. Insert emojis
      if (final.emojis.length > 0) {
        await supabase.from("profile_emojis").insert(
          final.emojis.map((emoji, i) => ({
            user_id: userId,
            emoji,
            position: i + 1,
          }))
        );
      }

      // 4. Insert photos
      if (photoUrls.length > 0) {
        const { error: photosError } = await supabase.from("profile_photos").insert(
          photoUrls.map((url, i) => ({
            user_id: userId,
            url,
            position: i + 1,
            is_primary: i === 0,
          }))
        );
        if (photosError) {
          console.warn("profile_photos insert failed:", photosError.message);
        }
      }

      // 5. Insert interests
      if (final.interests.length > 0) {
        await supabase.from("profile_interests").insert(
          final.interests.map((tag) => ({
            user_id: userId,
            interest_tag: tag,
          }))
        );
      }

      // 6. Insert availability slots
      if (final.availability.length > 0) {
        await supabase.from("profile_availability").insert(
          final.availability.map((slot) => ({
            user_id: userId,
            slot,
          }))
        );
      }

      completeOnboarding();
      setSubmitting(false);
      return { error: null };
    } catch (err: any) {
      setSubmitting(false);
      return { error: err.message || "Something went wrong" };
    }
  }, [session, data, completeOnboarding]);

  return (
    <OnboardingContext.Provider value={{ data, update, submit, submitting }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
