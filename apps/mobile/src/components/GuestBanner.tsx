import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { colors } from "../theme/colors";

const DISMISS_KEY = "pa_guest_banner_dismissed";

export function GuestBanner() {
  const { isGuest, isLoading } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    void AsyncStorage.getItem(DISMISS_KEY).then((v) => setDismissed(v === "1"));
  }, []);

  if (isLoading || !isGuest || dismissed) return null;

  const dismiss = () => {
    void AsyncStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.text} numberOfLines={2}>
        Preview mode — Sign up to use AI features
      </Text>
      <Button
        title="Create free account"
        onPress={() => router.push("/auth/register")}
        style={styles.cta}
        size="small"
      />
      <Pressable onPress={dismiss} hitSlop={8} accessibilityLabel="Dismiss">
        <Text style={styles.close}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accentDim,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
  cta: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 0,
  },
  close: {
    fontSize: 18,
    color: colors.textMuted,
    paddingHorizontal: 4,
  },
});
