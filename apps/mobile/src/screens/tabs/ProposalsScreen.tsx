import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Proposal } from "@proposalagent/shared";
import { Button } from "../../components/ui/Button";
import { useProposalsList } from "../../hooks/useProposalsList";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

function formatProposalDate(raw: Proposal["createdAt"]): string {
  if (raw == null) return "";
  const dt = typeof raw === "string" ? new Date(raw) : raw;
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_CHIP: Partial<
  Record<Proposal["status"], { bg: string; fg: string }>
> = {
  draft: { bg: colors.accentDim, fg: colors.accentText },
  sent: { bg: colors.surfaceHover, fg: colors.textMuted },
  viewed: { bg: colors.purpleDim, fg: colors.purple },
  replied: { bg: colors.successDim, fg: colors.success },
  shortlisted: { bg: colors.tealDim, fg: colors.teal },
  won: { bg: colors.successDim, fg: colors.success },
  lost: { bg: `${colors.danger}22`, fg: colors.danger },
};

export function ProposalsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useProposalsList();

  const items = data?.proposals ?? [];
  const bootLoading = isLoading && data === undefined;

  const header = useCallback(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Your proposals</Text>
        <Text style={styles.subtitle}>Drafts and sent pitches</Text>
      </View>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Proposal }) => {
      const chip = STATUS_CHIP[item.status] ?? {
        bg: colors.surfaceHover,
        fg: colors.textMuted,
      };
      const title =
        typeof item.job?.title === "string" && item.job.title.trim()
          ? item.job.title.trim()
          : "Proposal";
      const snippet = (item.content ?? "").replace(/\s+/g, " ").trim();
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            pressed && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
        >
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: chip.bg }]}>
              <Text style={[styles.statusTxt, { color: chip.fg }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {item.mode} · {item.variant} · {formatProposalDate(item.createdAt)}
          </Text>
          {snippet.length > 0 ? (
            <Text style={styles.snippet} numberOfLines={2}>
              {snippet.length > 180 ? `${snippet.slice(0, 180)}…` : snippet}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    []
  );

  if (bootLoading) {
    return (
      <View
        style={[
          styles.center,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading proposals…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.center,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          },
        ]}
      >
        <Text style={styles.errTitle}>Could not load proposals</Text>
        <Text style={styles.errSub}>
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No proposals yet</Text>
            <Text style={styles.emptySub}>
              Generate one from Jobs, then find it listed here.
            </Text>
            <Button
              title="Browse jobs"
              onPress={() => router.push("/(tabs)/jobs")}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  list: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  row: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minHeight: 28,
    justifyContent: "center",
  },
  statusTxt: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    textTransform: "uppercase",
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: 6,
  },
  snippet: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textDim,
    lineHeight: 18,
  },
  muted: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 8,
  },
  errTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "center",
  },
  errSub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
});
