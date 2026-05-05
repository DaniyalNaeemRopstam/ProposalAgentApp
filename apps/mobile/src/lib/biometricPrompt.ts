import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Alert, Platform } from "react-native";
import {
  PA_BIOMETRIC_ASKED_KEY,
  PA_BIOMETRIC_PREF_KEY,
} from "../constants/authStorage";

/**
 * After first successful password login, offer enabling Face ID / Touch ID.
 */
export async function offerBiometricEnrollment(): Promise<void> {
  if (Platform.OS === "web") return;

  const asked = await AsyncStorage.getItem(PA_BIOMETRIC_ASKED_KEY);
  if (asked === "1") return;

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    await AsyncStorage.setItem(PA_BIOMETRIC_ASKED_KEY, "1");
    return;
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    await AsyncStorage.setItem(PA_BIOMETRIC_ASKED_KEY, "1");
    return;
  }

  const type = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const label =
    type.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? "Face ID"
      : type.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? "Touch ID"
        : "biometric unlock";

  await new Promise<void>((resolve) => {
    Alert.alert(
      `Enable ${label}?`,
      "Unlock the app faster on your next visit without typing your password.",
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: () => {
            void AsyncStorage.setItem(PA_BIOMETRIC_ASKED_KEY, "1");
            resolve();
          },
        },
        {
          text: "Enable",
          onPress: () => {
            void (async () => {
              await AsyncStorage.setItem(PA_BIOMETRIC_PREF_KEY, "true");
              await AsyncStorage.setItem(PA_BIOMETRIC_ASKED_KEY, "1");
            })();
            resolve();
          },
        },
      ]
    );
  });
}
