import { createContext, useContext, useState } from "react";

// DEV MODE: Set to true to bypass auth and explore the UI
const DEV_BYPASS_AUTH = true;

type AuthContextType = {
  session: { user: { id: string } } | null;
  loading: boolean;
  needsOnboarding: boolean;
  devMode: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: false,
  needsOnboarding: false,
  devMode: DEV_BYPASS_AUTH,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const signIn = () => {
    // Dev mode: fake sign in and go straight to onboarding
    setSession({ user: { id: "dev-user" } });
    setNeedsOnboarding(true);
  };

  const signOut = () => {
    setSession(null);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading: false,
        needsOnboarding,
        devMode: DEV_BYPASS_AUTH,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
