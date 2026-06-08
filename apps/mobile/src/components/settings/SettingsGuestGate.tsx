import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { colors } from "../../theme/colors";

export function SettingsGuestGate({ children }: { children: React.ReactNode }) {
  const { isGuest, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (isGuest) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>Account required</Text>
        <Text style={styles.gateBody}>
          Sign in or create a free account to manage integrations, billing, and
          profile settings.
        </Text>
        <Button
          title="Sign in"
          onPress={() => router.push("/auth/login")}
          style={styles.primaryBtn}
        />
        <Button
          title="Create free account"
          variant="ghost"
          onPress={() => router.push("/auth/register")}
          style={styles.secondaryBtn}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  gate: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "stretch",
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  gateBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryBtn: {
    marginBottom: 10,
  },
  secondaryBtn: {},
});
