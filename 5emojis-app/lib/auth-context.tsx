import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Platform } from "react-native";
import { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";

// DEV MODE: Set to true to bypass auth and explore the UI
const DEV_BYPASS_AUTH = false;

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  needsOnboarding: boolean;
  devMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  needsOnboarding: false,
  devMode: DEV_BYPASS_AUTH,
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signIn: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  completeOnboarding: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Configure Google Sign-In once on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  // Check if the user has a profile in the DB
  const checkProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    return !!data;
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s);
        if (s?.user) {
          try {
            const hasProfile = await checkProfile(s.user.id);
            setNeedsOnboarding(!hasProfile);
          } catch {
            // profiles table may not exist yet — treat as needs onboarding
            setNeedsOnboarding(true);
          }
        }
      })
      .catch(() => {
        // Network/Supabase unreachable — proceed without session
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        try {
          const hasProfile = await checkProfile(s.user.id);
          setNeedsOnboarding(!hasProfile);
        } catch {
          setNeedsOnboarding(true);
        }
      } else {
        setNeedsOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkProfile]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message, needsConfirmation: false };
      // If Supabase returned a session, email confirmation is disabled — no need to confirm
      const needsConfirmation = !data.session;
      return { error: null, needsConfirmation };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    []
  );

  const signInWithApple = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { error: "No identity token returned from Apple." };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        return { error: null }; // User dismissed — not an error
      }
      return { error: e.message || "Apple Sign-In failed." };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!response.data?.idToken) {
        return { error: "No ID token returned from Google." };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.data.idToken,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      if (
        e.code === "SIGN_IN_CANCELLED" ||
        e.code === "12501" ||
        e.message?.includes("canceled")
      ) {
        return { error: null }; // User dismissed — not an error
      }
      if (e.code === "IN_PROGRESS") {
        return { error: null };
      }
      return { error: e.message || "Google Sign-In failed." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign out locally even if Supabase call fails
    }
    setSession(null);
    setNeedsOnboarding(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

  // Dev mode: fake session
  if (DEV_BYPASS_AUTH) {
    return (
      <AuthContext.Provider
        value={{
          session: { user: { id: "dev-user" } } as any,
          loading: false,
          needsOnboarding: true,
          devMode: true,
          signUp: async () => ({ error: null, needsConfirmation: false }),
          signIn: async () => ({ error: null }),
          signInWithApple: async () => ({ error: null }),
          signInWithGoogle: async () => ({ error: null }),
          signOut: async () => {},
          completeOnboarding: () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        needsOnboarding,
        devMode: DEV_BYPASS_AUTH,
        signUp,
        signIn,
        signInWithApple,
        signInWithGoogle,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
