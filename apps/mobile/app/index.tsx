import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../src/components/ui/Button";
import { colors } from "../src/theme/colors";

export default function IndexScreen() {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const attemptRoute = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const token = await AsyncStorage.getItem("authToken");
      router.replace(token ? "/(tabs)" : "/auth/login");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Unable to read saved session.";
      setErr(msg);
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void attemptRoute();
  }, [attemptRoute]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>ProposalAgent</Text>
        {busy && !err ? (
          <>
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
            <Text style={styles.subtitle}>Loading...</Text>
          </>
        ) : err ? (
          <>
            <Text style={styles.errTitle}>Something went wrong</Text>
            <Text style={styles.errSub}>{err}</Text>
            <Button title="Retry" onPress={() => void attemptRoute()} loading={busy} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
  },
  errTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
});
