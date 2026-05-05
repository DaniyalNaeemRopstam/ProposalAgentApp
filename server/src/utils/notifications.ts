const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushData = Record<string, string>;

/**
 * Sends a notification via Expo Push API.
 * @see https://docs.expo.dev/push-notifications/sending-notifications/
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: ExpoPushData = {}
): Promise<void> {
  if (!pushToken || typeof pushToken !== "string" || pushToken.trim() === "") {
    return;
  }

  const payload = {
    to: pushToken.trim(),
    sound: "default" as const,
    title,
    body,
    data,
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.warn("[push] Expo push failed:", res.status, txt);
  }
}
