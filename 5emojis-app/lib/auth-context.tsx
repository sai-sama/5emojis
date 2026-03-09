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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { deleteAccount as deleteAccountService } from "./profile-service";
import { registerForPushNotifications } from "./push-notifications";
import { logError } from "./error-logger";

// DEV MODE: Set to true to bypass auth and explore the UI
const DEV_BYPASS_AUTH = false;

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  needsOnboarding: boolean;
  isSuspended: boolean;
  suspendedUntil: string | null;
  isAdmin: boolean;
  devMode: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  needsOnboarding: false,
  isSuspended: false,
  suspendedUntil: null,
  isAdmin: false,
  devMode: DEV_BYPASS_AUTH,
  signUp: async () => ({ error: null, needsConfirmation: false }),
  signIn: async () => ({ error: null }),
  signInWithApple: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  deleteAccount: async () => ({ error: null }),
  completeOnboarding: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Configure Google Sign-In once on mount
  // iosClientId is required for the SDK to initialize on iOS (without
  // GoogleService-Info.plist). The webClientId ensures the returned ID token
  // is audience-matched for Supabase's server-side verification.
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  // Check if the user has a profile in the DB (and suspension status)
  const checkProfile = useCallback(async (userId: string): Promise<{
    exists: boolean;
    suspended: boolean;
    suspendedUntil: string | null;
    admin: boolean;
  }> => {
    const { data } = await supabase
      .from("profiles")
      .select("id, is_suspended, suspended_until, is_admin")
      .eq("id", userId)
      .single();
    if (!data) return { exists: false, suspended: false, suspendedUntil: null, admin: false };
    return {
      exists: true,
      suspended: !!data.is_suspended,
      suspendedUntil: data.suspended_until ?? null,
      admin: !!data.is_admin,
    };
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    // Failsafe: if session check hangs (bad network), stop loading after 8s
    // so the app never gets permanently stuck on the loading screen.
    const loadingTimeout = setTimeout(() => setLoading(false), 8000);

    // Track whether initial load is done. The onAuthStateChange listener
    // fires INITIAL_SESSION immediately with a potentially stale token —
    // we must ignore it and let our manual flow handle the first session.
    let initialLoadDone = false;

    // Fresh install detection: AsyncStorage is cleared on app uninstall,
    // but iOS Keychain (where Supabase stores auth tokens) persists.
    // If the flag is missing, this is a fresh install — clear stale tokens.
    const clearStaleSession = async () => {
      const hasLaunched = await AsyncStorage.getItem("has_launched_before");
      if (!hasLaunched) {
        await supabase.auth.signOut().catch(() => {});
        await AsyncStorage.setItem("has_launched_before", "true");
      }
    };

    // Manual session init: getUser() forces a server round-trip which
    // refreshes an expired token. We only set session AFTER this succeeds.
    clearStaleSession()
      .then(() => supabase.auth.getSession())
      .then(async ({ data: { session: s } }) => {
        if (s?.user) {
          try {
            const { data: authUser, error: authError } = await supabase.auth.getUser();
            if (authError || !authUser?.user) {
              await supabase.auth.signOut().catch(() => {});
              setSession(null);
              setNeedsOnboarding(false);
              return;
            }

            // getUser() triggers token refresh — re-read the now-valid session
            const { data: { session: refreshed } } = await supabase.auth.getSession();
            setSession(refreshed);

            const result = await checkProfile(authUser.user.id);
            setNeedsOnboarding(!result.exists);
            setIsSuspended(result.suspended);
            setSuspendedUntil(result.suspendedUntil);
            setIsAdmin(result.admin);
            if (result.exists && !result.suspended) {
              registerForPushNotifications(authUser.user.id);
            }
          } catch (err: any) {
            // Network error — set the cached session so app isn't stuck on sign-in.
            // Do NOT set needsOnboarding=true here — profile may exist, we just can't check.
            // The user will see the main app; if profile is truly missing, the next
            // successful API call will reveal it.
            setSession(s);
            logError(err, { screen: "AuthProvider", context: "session_profile_check" });
          }
        } else {
          setSession(null);
        }
      })
      .catch((err: any) => {
        logError(err, { screen: "AuthProvider", context: "get_session" });
      })
      .finally(() => {
        initialLoadDone = true;
        clearTimeout(loadingTimeout);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      // Skip INITIAL_SESSION — our manual flow above handles the first
      // session with a proper token refresh. Without this guard the
      // listener sets a stale cached token before the refresh finishes.
      if (!initialLoadDone) return;

      setSession(s);
      if (s?.user) {
        try {
          const result = await checkProfile(s.user.id);
          setNeedsOnboarding(!result.exists);
          setIsSuspended(result.suspended);
          setSuspendedUntil(result.suspendedUntil);
          setIsAdmin(result.admin);
          if (result.exists && !result.suspended) {
            registerForPushNotifications(s.user.id);
          }
        } catch (err: any) {
          // Network error — don't change onboarding state, keep previous value
          logError(err, { screen: "AuthProvider", context: "auth_state_change_profile_check" });
        }
      } else {
        setNeedsOnboarding(false);
        setIsSuspended(false);
        setSuspendedUntil(null);
        setIsAdmin(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      // Check profile before returning so needsOnboarding is set correctly
      if (data.session?.user) {
        const result = await checkProfile(data.session.user.id);
        setNeedsOnboarding(!result.exists);
        setIsSuspended(result.suspended);
        setSuspendedUntil(result.suspendedUntil);
        setIsAdmin(result.admin);
      }
      return { error: null };
    },
    [checkProfile]
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

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) return { error: error.message };
      // Check profile before returning so needsOnboarding is set correctly
      if (data.session?.user) {
        const result = await checkProfile(data.session.user.id);
        setNeedsOnboarding(!result.exists);
        setIsSuspended(result.suspended);
        setSuspendedUntil(result.suspendedUntil);
        setIsAdmin(result.admin);
      }
      return { error: null };
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        return { error: null }; // User dismissed — not an error
      }
      logError(e, { screen: "AuthProvider", context: "sign_in_with_apple" });
      return { error: e.message || "Apple Sign-In failed." };
    }
  }, [checkProfile]);

  const signInWithGoogle = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!response.data?.idToken) {
        return { error: "No ID token returned from Google." };
      }

      // On iOS, the native Google SDK embeds its own nonce in the ID token
      // but doesn't expose the raw value — passing the hashed nonce from the
      // JWT causes a double-hash mismatch in Supabase. The fix is to NOT pass
      // a nonce here and enable "Skip nonce checks" for Google in the Supabase
      // dashboard (Authentication → Providers → Google → Skip Nonce Check).
      // On Android, no nonce is present so this works as-is.
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.data.idToken,
      });

      if (error) return { error: error.message };
      // Check profile before returning so needsOnboarding is set correctly
      if (data.session?.user) {
        const result = await checkProfile(data.session.user.id);
        setNeedsOnboarding(!result.exists);
        setIsSuspended(result.suspended);
        setSuspendedUntil(result.suspendedUntil);
        setIsAdmin(result.admin);
      }
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
      logError(e, { screen: "AuthProvider", context: "sign_in_with_google" });
      return { error: e.message || "Google Sign-In failed." };
    }
  }, [checkProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      // Sign out locally even if Supabase call fails
      logError(err, { screen: "AuthProvider", context: "sign_out" });
    }
    // Clear cached Google account so the picker shows on next sign-in
    try { await GoogleSignin.signOut(); } catch {}
    setSession(null);
    setNeedsOnboarding(false);
    setIsSuspended(false);
    setSuspendedUntil(null);
    setIsAdmin(false);
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: "Not authenticated" };
    try {
      const { error } = await deleteAccountService(session.user.id);
      if (error) return { error };
      // Sign out of Supabase
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore sign-out errors — account is already gone
      }
      // Clear cached Google/Apple credentials so they can't auto-sign back in
      try { await GoogleSignin.signOut(); } catch {}
      setSession(null);
      setNeedsOnboarding(false);
      setIsSuspended(false);
      setSuspendedUntil(null);
      setIsAdmin(false);
      return { error: null };
    } catch (err: any) {
      logError(err, { screen: "AuthProvider", context: "delete_account" });
      return { error: err.message || "Failed to delete account" };
    }
  }, [session]);

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
          isSuspended: false,
          suspendedUntil: null,
          isAdmin: false,
          devMode: true,
          signUp: async () => ({ error: null, needsConfirmation: false }),
          signIn: async () => ({ error: null }),
          signInWithApple: async () => ({ error: null }),
          signInWithGoogle: async () => ({ error: null }),
          signOut: async () => {},
          deleteAccount: async () => ({ error: null }),
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
        isSuspended,
        suspendedUntil,
        isAdmin,
        devMode: DEV_BYPASS_AUTH,
        signUp,
        signIn,
        signInWithApple,
        signInWithGoogle,
        signOut,
        deleteAccount,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
