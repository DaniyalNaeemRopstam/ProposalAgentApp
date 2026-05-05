import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { serverApi } from "./api";

export const PA_EXPO_PUSH_TOKEN_KEY = "pa_last_expo_push_token";
const PA_NOTIFICATIONS_REQUESTED_KEY = "pa_notifications_perm_asked";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function postPushTokenToServer(expoPushToken: string): Promise<void> {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) return;

  try {
    await serverApi.request<unknown>("/api/users/push-token", {
      method: "POST",
      body: { pushToken: expoPushToken },
    });
  } catch (e) {
    console.warn("[push] Failed to register token:", e);
  }
}

export async function syncStoredPushTokenToServer(): Promise<void> {
  const stored = await AsyncStorage.getItem(PA_EXPO_PUSH_TOKEN_KEY);
  if (!stored) return;
  await postPushTokenToServer(stored);
}

/**
 * Request permission on first launch; obtain Expo push token and persist + POST when logged in.
 */
export async function setupPushRegistration(): Promise<void> {
  if (Platform.OS === "web") return;

  await ensureAndroidChannel();

  const marker = await AsyncStorage.getItem(PA_NOTIFICATIONS_REQUESTED_KEY);
  let perm = await Notifications.getPermissionsAsync();

  if (marker !== "1") {
    if (!perm.granted) {
      perm = await Notifications.requestPermissionsAsync();
    }
    await AsyncStorage.setItem(PA_NOTIFICATIONS_REQUESTED_KEY, "1");
  }

  if (!perm.granted) return;

  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoToken = tokenRes.data;
    await AsyncStorage.setItem(PA_EXPO_PUSH_TOKEN_KEY, expoToken);

    const authed = await AsyncStorage.getItem("authToken");
    if (authed) {
      await postPushTokenToServer(expoToken);
    }
  } catch (e) {
    console.warn("[push] Expo push token unavailable:", e);
  }
}
