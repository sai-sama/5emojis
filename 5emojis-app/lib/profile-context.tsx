import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "./auth-context";
import { fetchFullProfile, type FullProfile } from "./profile-service";

// ─── Context value ────────────────────────────────────────────
type ProfileContextValue = {
  profile: FullProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: async () => {},
});

export function useProfile() {
  return useContext(ProfileContext);
}

// ─── Provider ─────────────────────────────────────────────────
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    try {
      const data = await fetchFullProfile(session.user.id);
      if (data) setProfile(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Re-fetch whenever the profile stack gains focus
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}
