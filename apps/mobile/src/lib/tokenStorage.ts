import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const PA_TOKEN_KEY = "pa_token";
const LEGACY_AUTH_TOKEN = "authToken";

export async function getStoredToken(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(PA_TOKEN_KEY);
    if (secure?.trim()) return secure.trim();
  } catch {
    /* Keychain unavailable in sim / dev */
  }
  const legacy = await AsyncStorage.getItem(LEGACY_AUTH_TOKEN);
  if (legacy?.trim()) {
    try {
      await SecureStore.setItemAsync(PA_TOKEN_KEY, legacy.trim());
    } catch {
      /* keep legacy only */
    }
    await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN);
    return legacy.trim();
  }
  return null;
}

export async function setStoredToken(token: string): Promise<void> {
  const t = token.trim();
  await SecureStore.setItemAsync(PA_TOKEN_KEY, t);
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN);
}

export async function clearStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PA_TOKEN_KEY);
  } catch {
    /* missing key */
  }
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN);
}
