import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../src/theme/colors";

export default function IndexScreen() {
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          // User is logged in, go to tabs
          router.replace("/(tabs)");
        } else {
          // User not logged in, go to login
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/auth/login");
      }
    }

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProposalAgent</Text>
      <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});