import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/Button";
import { serverApi } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const H = Dimensions.get("window").height;

export type UpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onMaybeLater: () => void;
};

export function UpgradeModal({ visible, onClose, onMaybeLater }: UpgradeModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function openCheckout() {
    setErr(null);
    setLoading(true);
    try {
      const data = await serverApi.request<{ checkoutUrl: string }>(
        "/api/billing/create-checkout",
        {
          method: "POST",
          body: { plan: "solo" },
        }
      );
      const url = data.checkoutUrl;
      if (!url) throw new Error("No checkout URL");
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else throw new Error("Cannot open checkout URL");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.flex1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              height: H * 0.8,
              paddingBottom: Math.max(16, insets.bottom + 12),
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <ScrollView contentContainerStyle={styles.pad}>
            <Text style={styles.head}>3/3 free proposals used</Text>

            <View style={styles.track}>
              <View style={styles.fill} />
            </View>

            <Text style={styles.sub}>Upgrade to keep winning clients</Text>

            <View style={styles.card}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Solo — recommended</Text>
              </View>
              <Text style={styles.price}>$49/month</Text>
              <Text style={styles.cardBody}>
                Unlimited proposals · All platforms · Follow-ups · Analytics
              </Text>
              <Button
                title={loading ? "Opening…" : "Upgrade to Solo"}
                onPress={() => void openCheckout()}
                disabled={loading}
              />
              {loading ? (
                <ActivityIndicator style={{ marginTop: 8 }} color={colors.accent} />
              ) : null}
              {err ? <Text style={styles.err}>{err}</Text> : null}
            </View>

            <Pressable
              onPress={() => {
                onClose();
                onMaybeLater();
              }}
              style={styles.later}
            >
              <Text style={styles.laterText}>Maybe later</Text>
            </Pressable>

            <Text style={styles.lock}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textDim} /> Secure payment
              via Stripe
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  flex1: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  pad: { paddingHorizontal: 20 },
  head: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
  },
  track: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: "100%",
    width: "100%",
    backgroundColor: colors.accent,
  },
  sub: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    backgroundColor: `${colors.accent}14`,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.5 },
  price: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: colors.text,
  },
  cardBody: {
    marginVertical: 10,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  err: { color: colors.danger, marginTop: 8, fontSize: 13 },
  later: { marginTop: 20, alignItems: "center" },
  laterText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 15 },
  lock: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    color: colors.textDim,
    fontFamily: fonts.regular,
  },
});
