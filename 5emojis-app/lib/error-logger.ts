import { Platform } from "react-native";
import { supabase } from "./supabase";
import Constants from "expo-constants";

let isInitialized = false;

/**
 * Log an error to the Supabase error_logs table.
 * Silently fails — never throws (to avoid error-in-error loops).
 */
export async function logError(
  error: Error | string,
  extra?: {
    componentStack?: string;
    screen?: string;
    context?: string;
  }
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    await supabase.from("error_logs").insert({
      user_id: session?.user?.id ?? null,
      error_message: typeof error === "string" ? error : error.message,
      error_stack: typeof error === "string" ? null : error.stack ?? null,
      component_stack: extra?.componentStack ?? null,
      screen: extra?.screen ?? null,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? "unknown",
      extra: extra?.context ? { context: extra.context } : null,
    });
  } catch {
    // Silently fail — we can't log an error about logging errors
  }
}

/**
 * Set up global handlers for uncaught JS errors and unhandled promise rejections.
 * Call once in the root layout.
 */
export function initErrorLogging() {
  if (isInitialized) return;
  isInitialized = true;

  // Global JS error handler
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logError(error, { context: isFatal ? "fatal" : "uncaught" });
    // Call the original handler so React Native still shows the red screen in dev
    originalHandler(error, isFatal);
  });

  // Unhandled promise rejections
  const originalRejectionTracking = (global as any).__promiseRejectionTrackingOptions;
  if (!originalRejectionTracking) {
    // @ts-ignore — React Native internals
    require("promise/setimmediate/rejection-tracking").enable({
      allRejections: true,
      onUnhandled: (_id: number, error: Error) => {
        logError(error, { context: "unhandled-promise" });
      },
    });
  }
}
