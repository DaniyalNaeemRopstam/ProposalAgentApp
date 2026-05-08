import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Job } from "@proposalagent/shared";
import { JobCard } from "../../components/JobCard";
import { Button } from "../../components/ui/Button";
import {
  useAnalyzePasteJob,
  useDeleteJob,
  useJobs,
  type JobsPlatformFilter,
} from "../../hooks/useJobs";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const FILTERS: { key: JobsPlatformFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Upwork", label: "Upwork" },
  { key: "LinkedIn", label: "LinkedIn" },
  { key: "Wellfound", label: "Wellfound" },
  { key: "aggregated", label: "Auto-matched" },
  { key: "manual", label: "Manual" },
];

function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "Never";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function SyncBanner({
  isRefetching,
  lastSync,
  onSync,
}: {
  isRefetching: boolean;
  lastSync: Date | null | undefined;
  onSync: () => void;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefetching) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isRefetching, rotation]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.syncBanner}>
      <Text style={styles.syncText}>Last synced: {formatRelativeTime(lastSync)}</Text>
      <Pressable
        onPress={onSync}
        disabled={isRefetching}
        style={isRefetching ? { opacity: 0.6 } : {}}
      >
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name="refresh"
            size={18}
            color={colors.accent}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function SkeletonBlock({ style }: { style?: object }) {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.65, { duration: 750 }), -1, true);
  }, [o]);
  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
  }));
  return <Animated.View style={[styles.skelLine, style, animated]} />;
}

function JobsSkeletonList() {
  return (
    <View style={styles.skelWrap}>
      {[0, 1, 2].map((k) => (
        <View key={k} style={styles.skelCard}>
          <View style={styles.skelRow}>
            <SkeletonBlock style={styles.skelRing} />
            <View style={styles.skelCol}>
              <SkeletonBlock style={{ width: "78%", height: 14, marginBottom: 10 }} />
              <SkeletonBlock style={{ width: "55%", height: 11, marginBottom: 10 }} />
              <SkeletonBlock style={{ width: "100%", height: 11, marginBottom: 8 }} />
              <SkeletonBlock style={{ width: "92%", height: 11 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function JobsTabScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<JobsPlatformFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    lastSync,
  } = useJobs(filter);
  const deleteJob = useDeleteJob();
  const analyzePaste = useAnalyzePasteJob();

  const net = useNetworkStatus();
  const offline =
    net.isConnected === false || net.isInternetReachable === false;

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  const onGenerate = useCallback((job: Job) => {
    router.push({
      pathname: "/(tabs)/proposal",
      params: { jobId: String(job._id) },
    });
  }, []);

  const renderLeftActions = useCallback(() => {
    return (
      <View style={styles.actionSave}>
        <Ionicons name="bookmark" size={22} color={colors.success} />
        <Text style={styles.actionSaveText}>Save</Text>
      </View>
    );
  }, []);

  const renderRightActions = useCallback(() => {
    return (
      <View style={styles.actionSkip}>
        <Ionicons name="trash-outline" size={22} color={colors.danger} />
        <Text style={styles.actionSkipText}>Skip</Text>
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Job }) => {
      const id = String(item._id);
      return (
        <Swipeable
          friction={2}
          renderLeftActions={renderLeftActions}
          renderRightActions={renderRightActions}
          onSwipeableWillOpen={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onSwipeableOpen={(direction, swipeable) => {
            if (direction === "left") {
              setSavedIds((prev) => new Set(prev).add(id));
              swipeable.close();
            } else {
              deleteJob.mutate(id);
            }
          }}
        >
          <JobCard
            job={item}
            expanded={expandedId === id}
            onToggleExpand={() => toggleExpand(id)}
            onGenerateProposal={() => onGenerate(item)}
            onSkip={() => deleteJob.mutate(id)}
            savedHighlight={savedIds.has(id)}
            offline={offline}
          />
        </Swipeable>
      );
    },
    [
      deleteJob,
      expandedId,
      offline,
      onGenerate,
      renderLeftActions,
      renderRightActions,
      savedIds,
      toggleExpand,
    ]
  );

  const listHeader = (
    <View>
      <SyncBanner
        isRefetching={isRefetching}
        lastSync={lastSync}
        onSync={() => refetch()}
      />
      <View style={styles.headerBlock}>
        <Text style={styles.blurb}>
          AI found{" "}
          <Text style={styles.blurbAccent}>{jobs.length} high-fit jobs</Text> in the
          last 2 hours across Upwork, LinkedIn & Wellfound
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  setFilter(f.key);
                  setExpandedId(null);
                }}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errTitle}>Failed to load jobs</Text>
        <Text style={styles.errSub}>
          {error instanceof Error ? error.message : "Try again"}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 72 }]}>
      {isLoading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {listHeader}
          <JobsSkeletonList />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          initialNumToRender={5}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={[
            styles.listContent,
            jobs.length === 0 && styles.listEmptyGrow,
          ]}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="briefcase-outline" size={36} color={colors.textDim} />
              </View>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySub}>
                Paste a job or check back when new listings match your profile.
              </Text>
              <Button
                title="Paste a job manually"
                disabled={offline}
                onPress={() => setPasteOpen(true)}
              />
              {offline ? (
                <Text style={styles.offlinePasteHint}>Paste requires internet.</Text>
              ) : null}
            </View>
          }
        />
      )}

      <Pressable
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 16,
            right: 16,
          },
          offline && styles.fabDisabled,
        ]}
        disabled={offline}
        onPress={() => {
          if (!offline) setPasteOpen(true);
        }}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </Pressable>

      <Modal
        visible={pasteOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPasteOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setPasteOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>Paste job</Text>
            <Text style={styles.sheetHint}>
              Paste an Upwork post, LinkedIn job, or email. We&apos;ll analyze and
              score it.
            </Text>
            <TextInput
              style={styles.sheetInput}
              multiline
              numberOfLines={6}
              placeholder="Paste description here…"
              placeholderTextColor={colors.textDim}
              value={pasteText}
              onChangeText={setPasteText}
            />
            <Button
              title={analyzePaste.isPending ? "Analyzing…" : "Analyze & Score"}
              loading={analyzePaste.isPending}
              disabled={!pasteText.trim() || analyzePaste.isPending || offline}
              onPress={() =>
                analyzePaste.mutate(pasteText, {
                  onSuccess: () => {
                    setPasteText("");
                    setPasteOpen(false);
                  },
                })
              }
            />
            {offline ? (
              <Text style={styles.sheetOffline}>
                Internet required to paste and analyze jobs.
              </Text>
            ) : null}
            <Button title="Cancel" variant="ghost" onPress={() => setPasteOpen(false)} />
            {analyzePaste.error ? (
              <Text style={styles.sheetErr}>{analyzePaste.error.message}</Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  syncText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  listEmptyGrow: {
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: 14,
  },
  blurb: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  blurbAccent: {
    color: colors.accent,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
  },
  pillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  pillActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  pillText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  pillTextActive: {
    color: colors.accentText,
    fontFamily: fonts.semiBold,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  errTitle: {
    fontSize: 18,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  errSub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: fonts.regular,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  offlinePasteHint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.warnText,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: {
    opacity: 0.42,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  sheetHint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  sheetInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.bg,
    fontSize: 14,
    textAlignVertical: "top",
    fontFamily: fonts.regular,
  },
  sheetErr: {
    color: colors.danger,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  sheetOffline: {
    fontSize: 12,
    color: colors.warnText,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  actionSave: {
    width: 84,
    backgroundColor: colors.successDim,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 10,
    gap: 4,
  },
  actionSaveText: {
    color: colors.success,
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  actionSkip: {
    width: 84,
    backgroundColor: `${colors.danger}22`,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginLeft: 10,
    gap: 4,
  },
  actionSkipText: {
    color: colors.danger,
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  skelWrap: { gap: 12 },
  skelCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  skelRow: { flexDirection: "row", gap: 12 },
  skelRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  skelCol: { flex: 1 },
  skelLine: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 6,
  },
});
