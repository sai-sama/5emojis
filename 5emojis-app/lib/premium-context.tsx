import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";
import { logError } from "./error-logger";

// ─── RevenueCat API Keys ────────────────────────────────────
// Set these in your .env file after creating a RevenueCat project
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

// The entitlement ID configured in RevenueCat dashboard
const PREMIUM_ENTITLEMENT = "premium";

type PremiumContextType = {
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  packages: PurchasesPackage[];
  purchase: (pkg: PurchasesPackage) => Promise<{ error: string | null }>;
  restore: () => Promise<{ error: string | null }>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  isAdmin: false,
  loading: true,
  packages: [],
  purchase: async () => ({ error: null }),
  restore: async () => ({ error: null }),
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { session, isAdmin } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [premiumGated, setPremiumGated] = useState(false);

  // Fetch premium gate setting from DB
  useEffect(() => {
    if (!session?.user) return;

    const fetchGateSetting = async () => {
      try {
        // Fetch gate settings and user's city in parallel
        const [settingsRes, profileRes] = await Promise.all([
          supabase.from("app_settings" as any).select("value").eq("key", "premium_gate").single(),
          supabase.from("profiles").select("city").eq("id", session.user.id).single(),
        ]);

        const settings = (settingsRes.data as any)?.value as {
          enabled: boolean;
          mode: string;
          gated_cities: string[];
        } | null;

        if (!settings?.enabled) {
          setPremiumGated(false);
          return;
        }

        if (settings.mode === "global") {
          setPremiumGated(true);
        } else if (settings.mode === "per_city") {
          const userCity = profileRes.data?.city ?? "";
          setPremiumGated(settings.gated_cities.includes(userCity));
        }
      } catch (err: any) {
        // If fetch fails, default to ungated (free premium)
        logError(err, { screen: "PremiumProvider", context: "fetch_gate_setting" });
      }
    };

    fetchGateSetting();
  }, [session]);

  // Initialize RevenueCat
  useEffect(() => {
    const apiKey = Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    if (!apiKey) {
      // RevenueCat not configured yet — skip initialization
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        Purchases.configure({ apiKey });
        setInitialized(true);
      } catch (err: any) {
        logError(err, { screen: "PremiumProvider", context: "configure" });
        setLoading(false);
      }
    };

    init();
  }, []);

  // Identify user with RevenueCat when session changes
  useEffect(() => {
    if (!initialized || !session?.user) return;

    const identify = async () => {
      try {
        const { customerInfo } = await Purchases.logIn(session.user.id);
        checkEntitlements(customerInfo);
      } catch (err: any) {
        logError(err, { screen: "PremiumProvider", context: "identify_user" });
      }
    };

    identify();
  }, [initialized, session]);

  // Fetch available packages
  useEffect(() => {
    if (!initialized) return;

    const fetchPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (err: any) {
        logError(err, { screen: "PremiumProvider", context: "fetch_offerings" });
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [initialized]);

  // Listen for subscription changes
  useEffect(() => {
    if (!initialized) return;

    const listener = (info: CustomerInfo) => {
      checkEntitlements(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [initialized]);

  const checkEntitlements = useCallback(
    (info: CustomerInfo) => {
      const hasPremium = !!info.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);

      // Sync premium status to database
      if (session?.user) {
        supabase
          .from("profiles")
          .update({
            is_premium: hasPremium,
            premium_until: hasPremium
              ? info.entitlements.active[PREMIUM_ENTITLEMENT]?.expirationDate
              : null,
          })
          .eq("id", session.user.id)
          .then(() => {});
      }
    },
    [session]
  );

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<{ error: string | null }> => {
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        checkEntitlements(customerInfo);
        return { error: null };
      } catch (err: any) {
        if (err.userCancelled) return { error: null };
        logError(err, { screen: "PremiumProvider", context: "purchase" });
        return { error: err.message || "Purchase failed" };
      }
    },
    [checkEntitlements]
  );

  const restore = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      const info = await Purchases.restorePurchases();
      checkEntitlements(info);
      const hasPremium = !!info.entitlements.active[PREMIUM_ENTITLEMENT];
      if (!hasPremium) {
        return { error: "No active subscription found" };
      }
      return { error: null };
    } catch (err: any) {
      logError(err, { screen: "PremiumProvider", context: "restore" });
      return { error: err.message || "Restore failed" };
    }
  }, [checkEntitlements]);

  // When premiumGated is false (default), everyone gets premium free (launch mode).
  // Toggle via Admin Panel > Premium Gate to start gating when ready.
  const effectivePremium = !premiumGated || isPremium || isAdmin;

  return (
    <PremiumContext.Provider
      value={{
        isPremium: effectivePremium,
        isAdmin,
        loading,
        packages,
        purchase,
        restore,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
