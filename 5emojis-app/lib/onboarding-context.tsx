import { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

export type OnboardingData = {
  name: string;
  dob: Date | null;
  photos: string[]; // local URIs
  emojis: string[];
  profession: string;
  lifeStage: string;
  friendshipStyles: string[];
  interests: string[];
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isNewToCity: boolean;
};

const EMPTY: OnboardingData = {
  name: "",
  dob: null,
  photos: [],
  emojis: [],
  profession: "",
  lifeStage: "",
  friendshipStyles: [],
  interests: [],
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

      // 1. Upload photos to Supabase Storage
      const photoUrls: string[] = [];
      for (let i = 0; i < final.photos.length; i++) {
        const uri = final.photos[i];
        const rawExt = uri.split(".").pop()?.toLowerCase() || "";
        const ext = ["jpg", "jpeg", "png", "webp", "heic"].includes(rawExt) ? rawExt : "jpg";
        const path = `${userId}/${Date.now()}_${i}.${ext}`;

        // Read file as ArrayBuffer (blob doesn't work in React Native)
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, arrayBuffer, { contentType: `image/${ext}` });

        if (uploadError) {
          console.warn(`Photo upload failed (${i}):`, uploadError.message);
        } else {
          const { data: urlData } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      // 2. Insert profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name: final.name,
        dob: final.dob.toISOString().split("T")[0],
        profession: final.profession || null,
        life_stage: final.lifeStage || null,
        friendship_style: final.friendshipStyles[0] || null,
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
        await supabase.from("profile_photos").insert(
          photoUrls.map((url, i) => ({
            user_id: userId,
            url,
            position: i + 1,
            is_primary: i === 0,
          }))
        );
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
