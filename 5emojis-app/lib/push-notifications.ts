import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "./supabase";
import { logError } from "./error-logger";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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

  // Android: set notification channel
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C3AED",
    });
  }

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
    await fetch("https://exp.host/--/api/v2/push/send", {
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
        data: data ?? {},
      }),
    });
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
    `You and ${matcherName} vibed each other!`,
    { type: "match", matchId }
  );
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
  onNavigate: (matchId: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data?.matchId) {
        onNavigate(data.matchId as string);
      }
    }
  );

  return () => subscription.remove();
}
