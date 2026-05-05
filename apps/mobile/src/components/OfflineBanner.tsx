import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const net = useNetworkStatus();
  const offline =
    net.isConnected === false || net.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View
      style={[
        styles.banner,
        { paddingTop: Math.max(insets.top, 6), paddingHorizontal: 12 },
      ]}
      accessibilityRole="alert"
    >
      <Text style={styles.text}>📡 Offline — showing cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warnDim,
    paddingBottom: 8,
  },
  text: {
    color: colors.warnText,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    textAlign: "center",
  },
});
