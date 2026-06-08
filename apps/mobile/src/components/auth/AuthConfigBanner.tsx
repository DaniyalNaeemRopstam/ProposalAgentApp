import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { getApiBaseUrl } from "../../lib/api";
import { isApiUrlMisconfigured } from "../../lib/authApiErrors";
import { colors } from "../../theme/colors";

/** Dev-only hint when API URL may not work on a physical device or is misconfigured. */
export function AuthConfigBanner() {
  if (!__DEV__) return null;

  const base = getApiBaseUrl();
  const misconfigured = isApiUrlMisconfigured();
  const isLocalhost =
    base.includes("localhost") ||
    base.includes("127.0.0.1") ||
    base.includes("10.0.2.2");

  if (!misconfigured && !isLocalhost) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>API configuration</Text>
      <Text style={styles.mono} numberOfLines={2}>
        {base}
      </Text>
      {misconfigured ? (
        <Text style={styles.warn}>
          EXPO_PUBLIC_API_URL looks wrong — use your Railway backend URL in
          apps/mobile/.env
        </Text>
      ) : null}
      {isLocalhost ? (
        <Text style={styles.hint}>
          Localhost only works on a simulator with the API running on your
          machine. On a physical device, use the Railway URL in .env.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 4,
  },
  mono: {
    fontSize: 11,
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  warn: {
    marginTop: 8,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 18,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
