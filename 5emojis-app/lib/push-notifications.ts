import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";
import { logError } from "./error-logger";

// Track which chat the user is currently viewing — set by ChatScreen
let _activeMatchId: string | null = null;
export function setActiveChatId(matchId: string | null) {
  _activeMatchId = matchId;
}

// Configure how notifications appear when the app is in the foreground.
// Suppress notification if the user is already viewing the relevant chat.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    // If user is actively viewing this chat, suppress the alert
    if (data?.matchId && data.matchId === _activeMatchId) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

/**
 * Register for push notifications, get the Expo push token,
 * and save it to the user's profile in Supabase.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check / request permission
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  // Get the Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("No EAS project ID found for push notifications");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  // Save token to profile
  await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);

  return token;
}

/**
 * Send a push notification to a specific user via their Expo push token.
 * Fetches their token from the DB, then calls Expo's push API.
 */
export async function sendPushNotification(
  recipientUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // Get the recipient's push token
    const { data: profile } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", recipientUserId)
      .single();

    const token = profile?.push_token;
    if (!token) return;

    // Send via Expo Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
        channelId: "default",
        data: data ?? {},
      }),
    });

    // Check for invalid/expired tokens and clean them up
    if (response.ok) {
      try {
        const result = await response.json();
        const ticketData = result?.data;
        if (ticketData?.status === "error" && ticketData?.details?.error === "DeviceNotRegistered") {
          // Token is invalid — remove it from the profile
          await supabase.from("profiles").update({ push_token: null }).eq("id", recipientUserId);
        }
      } catch {
        // JSON parse failed — ignore
      }
    }
  } catch (err: any) {
    // Silently fail — push is best-effort
    logError(err, { screen: "PushNotifications", context: "send_push_notification" });
  }
}

/**
 * Notify a user that they have a new match.
 */
export async function notifyNewMatch(
  recipientUserId: string,
  matcherName: string,
  matchId: string
): Promise<void> {
  await sendPushNotification(
    recipientUserId,
    "New Match! 🎉",
    `You and ${matcherName} matched!`,
    { type: "match", matchId }
  );
}

/**
 * Notify a user that someone liked them.
 * Premium users see who liked them; free users get a teaser.
 */
export async function notifyNewLike(
  recipientUserId: string,
  likerName: string
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", recipientUserId)
      .single();

    const isPremium = profile?.is_premium === true;

    await sendPushNotification(
      recipientUserId,
      isPremium ? "Someone vibed with you! 💜" : "Someone vibed with you! 💜",
      isPremium
        ? `${likerName} liked you! Check who liked you to connect.`
        : "Someone liked your profile! Keep swiping to find them or upgrade to see who.",
      { type: "like", screen: "vibes" }
    );
  } catch (err: any) {
    logError(err, { screen: "PushNotifications", context: "notify_new_like" });
  }
}

/**
 * Notify a user that someone super liked them.
 * Premium users see who; free users get a teaser.
 */
export async function notifyNewSuperLike(
  recipientUserId: string,
  likerName: string
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", recipientUserId)
      .single();

    const isPremium = profile?.is_premium === true;

    await sendPushNotification(
      recipientUserId,
      "You got a Super Like! ⭐",
      isPremium
        ? `${likerName} super liked you! Check who liked you to connect.`
        : "Someone super liked your profile! Upgrade to see who.",
      { type: "super_like", screen: "vibes" }
    );
  } catch (err: any) {
    logError(err, { screen: "PushNotifications", context: "notify_new_super_like" });
  }
}

/**
 * Notify a user that they received a new message.
 */
export async function notifyNewMessage(
  recipientUserId: string,
  senderName: string,
  matchId: string,
  isEmojiOnly: boolean
): Promise<void> {
  await sendPushNotification(
    recipientUserId,
    senderName,
    isEmojiOnly ? "Sent their icebreaker emojis! 🧊" : "Sent you a message 💬",
    { type: "message", matchId }
  );
}

/**
 * Add a notification response listener to handle taps on notifications.
 * Returns a cleanup function.
 */
export function addNotificationResponseListener(
  onNavigate: (matchId: string) => void,
  onNavigateScreen?: (screen: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.matchId) {
        onNavigate(data.matchId as string);
      } else if (data?.screen && onNavigateScreen) {
        onNavigateScreen(data.screen as string);
      }
    }
  );

  return () => subscription.remove();
}

/**
 * Check if the app was launched from a notification tap (cold start).
 * Should be called once on app startup.
 */
export async function checkInitialNotification(
  onNavigate: (matchId: string) => void,
  onNavigateScreen?: (screen: string) => void
): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    const data = response.notification.request.content.data;
    if (data?.matchId) {
      onNavigate(data.matchId as string);
    } else if (data?.screen && onNavigateScreen) {
      onNavigateScreen(data.screen as string);
    }
  }
}
