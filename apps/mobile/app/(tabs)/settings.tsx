import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../src/theme/colors";
import { fonts } from "../../src/theme/fonts";
import { Button } from "../../src/components/ui/Button";

const PLATFORMS = [
  { id: "upwork", name: "Upwork", icon: "briefcase-outline" },
  { id: "linkedin", name: "LinkedIn", icon: "logo-linkedin" },
  { id: "wellfound", name: "Wellfound", icon: "star-outline" },
  { id: "hackernews", name: "Hacker News", icon: "newspaper-outline" },
];

interface PlatformDetail {
  status: string;
  jobsCount: number;
  lastSync: string;
  requiresAuth?: boolean;
  apiKeySet?: boolean;
}

function PlatformRow({
  platform: { id, name, icon },
  onPress,
}: {
  platform: (typeof PLATFORMS)[0];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.platformRow}>
      <View style={styles.platformLeft}>
        <Ionicons name={icon as any} size={24} color={colors.accent} />
        <Text style={styles.platformName}>{name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

interface DetailBottomSheetProps {
  platform: (typeof PLATFORMS)[0] | null;
  onClose: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

function DetailBottomSheet({
  platform,
  onClose,
  onSync,
  isSyncing,
}: DetailBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState("");

  const details: Record<string, PlatformDetail> = {
    upwork: {
      status: "Connected via RSS feed",
      jobsCount: 48,
      lastSync: "2 hours ago",
    },
    linkedin: {
      status: "Setup required",
      jobsCount: 0,
      lastSync: "Never",
      requiresAuth: true,
      apiKeySet: false,
    },
    wellfound: {
      status: "Auto-enabled",
      jobsCount: 32,
      lastSync: "1 hour ago",
    },
    hackernews: {
      status: "Auto-enabled",
      jobsCount: 18,
      lastSync: "30 minutes ago",
    },
  };

  const detail = platform ? details[platform.id] : null;

  return (
    <Modal
      visible={platform !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />

        {detail && (
          <>
            <View style={styles.sheetHeader}>
              <Ionicons
                name={platform?.icon as any}
                size={28}
                color={colors.accent}
              />
              <Text style={styles.sheetTitle}>{platform?.name}</Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{detail.status}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Jobs fetched</Text>
                <Text style={styles.detailValue}>{detail.jobsCount}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last sync</Text>
                <Text style={styles.detailValue}>{detail.lastSync}</Text>
              </View>
            </View>

            {detail.requiresAuth && !detail.apiKeySet && (
              <View style={styles.authSection}>
                <Text style={styles.authTitle}>Enter API Key</Text>
                <TextInput
                  placeholder="Paste RapidAPI key…"
                  placeholderTextColor={colors.textDim}
                  value={apiKey}
                  onChangeText={setApiKey}
                  style={styles.apiKeyInput}
                  secureTextEntry
                />
                <Text style={styles.authHint}>
                  Get a free key at rapidapi.com
                </Text>
                <Button
                  title="Save API Key"
                  onPress={() => {
                    // TODO: Save API key to backend
                    setApiKey("");
                    onClose();
                  }}
                  style={styles.saveKeyBtn}
                />
              </View>
            )}

            <Button
              title={isSyncing ? "Syncing…" : "Sync now"}
              loading={isSyncing}
              disabled={isSyncing}
              onPress={onSync}
              style={styles.syncBtn}
            />

            <Button
              title="Close"
              variant="ghost"
              onPress={onClose}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof PLATFORMS)[0] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.sectionTitle}>Job Integrations</Text>
      <Text style={styles.sectionSubtitle}>
        Configure which platforms to fetch jobs from
      </Text>

      <View style={styles.platformList}>
        {PLATFORMS.map((platform) => (
          <PlatformRow
            key={platform.id}
            platform={platform}
            onPress={() => setSelectedPlatform(platform)}
          />
        ))}
      </View>

      <Button
        title="Sync all platforms"
        onPress={handleSync}
        style={styles.syncAllBtn}
      />

      <DetailBottomSheet
        platform={selectedPlatform}
        onClose={() => setSelectedPlatform(null)}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: 16,
  },
  platformList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  platformLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  platformName: {
    fontSize: 15,
    fontFamily: fonts.medium,
    fontWeight: "500",
    color: colors.text,
  },
  syncAllBtn: {
    marginBottom: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
    color: colors.text,
  },
  detailGrid: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textDim,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  authSection: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  authTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.bg,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  authHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  saveKeyBtn: {
    marginTop: 4,
  },
  syncBtn: {
    marginBottom: 8,
  },
});
