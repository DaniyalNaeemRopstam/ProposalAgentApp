import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  FollowUpMessage,
  FollowUpSequence,
} from "@proposalagent/shared";
import { Button } from "../../components/ui/Button";
import { useSequences } from "../../hooks/useSequences";
import { useAuth } from "../../context/AuthContext";
import { serverApi } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const ACC_EXPAND = 220;

function getStatusTone(sequence: FollowUpSequence): "warn" | "accent" | "success" {
  if (sequence.status === "stopped") return "success";
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "success";
  const scheduled = new Date(pending.scheduledAt);
  const hoursUntil =
    (scheduled.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil <= 0) return "accent";
  if (hoursUntil <= 48) return "warn";
  return "accent";
}

function getStatusText(sequence: FollowUpSequence): string {
  if (sequence.status === "stopped") return "Sequence stopped";
  if (sequence.status === "replied") return "Client replied";
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "All messages sent";
  return sequence.viewed ? "Proposal viewed" : "Awaiting reply";
}

function getNextText(sequence: FollowUpSequence): string {
  if (sequence.status === "stopped") return "No further follow-ups";
  if (sequence.status === "replied") return "Call scheduled — no follow-up needed";
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "Sequence complete";
  const scheduled = new Date(pending.scheduledAt);
  const diffDays = Math.ceil(
    (scheduled.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 0) return "Ready to send now";
  if (diffDays === 1) return `Day ${pending.day} follow-up tomorrow`;
  return `Day ${pending.day} follow-up in ${diffDays} days`;
}

function getRelativeTime(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffHours >= 1) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return "Just now";
}

const toneFg: Record<"warn" | "accent" | "success", string> = {
  warn: colors.warn,
  accent: colors.accentText,
  success: colors.success,
};

const toneBg: Record<"warn" | "accent" | "success", string> = {
  warn: colors.warnDim,
  accent: colors.accentDim,
  success: colors.successDim,
};

function StatsRow(props: {
  active: number;
  replies: number;
  shortlisted: number;
}) {
  const cards = [
    { label: "Active", value: props.active, c: colors.accent },
    { label: "Replies", value: props.replies, c: colors.teal },
    { label: "Shortlisted", value: props.shortlisted, c: colors.purple },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.statsRow}
    >
      {cards.map((x) => (
        <View key={x.label} style={[styles.statCard, { borderColor: x.c }]}>
          <Text style={styles.statVal} numberOfLines={1}>
            {x.value}
          </Text>
          <Text style={styles.statLbl}>{x.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MessageDayRow({
  msg,
  onPreview,
}: {
  msg: FollowUpMessage;
  onPreview: (m: FollowUpMessage) => void;
}) {
  const st =
    msg.status === "sent"
      ? colors.success
      : msg.status === "skipped"
        ? colors.textDim
        : colors.warn;
  const stLabel =
    msg.status === "sent"
      ? "Sent"
      : msg.status === "skipped"
        ? "Skipped"
        : "Pending";
  return (
    <View style={styles.dayRow}>
      <View style={styles.dayLeft}>
        <Text style={styles.dayTitle}>Day {msg.day}</Text>
        <Text style={[styles.dayStatus, { color: st }]}>{stLabel}</Text>
      </View>
      <Pressable
        onPress={() => onPreview(msg)}
        style={({ pressed }) => [
          styles.previewBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="mail-outline" size={14} color={colors.accent} />
        <Text style={styles.previewBtnText}>Preview</Text>
      </Pressable>
    </View>
  );
}

function SequenceCard({
  item,
  expanded,
  onToggle,
  onPreview,
  renderLeftActions,
  renderRightActions,
  onSwipeOpen,
}: {
  item: FollowUpSequence;
  expanded: boolean;
  onToggle: () => void;
  onPreview: (m: FollowUpMessage) => void;
  renderLeftActions: () => React.ReactNode;
  renderRightActions: () => React.ReactNode;
  onSwipeOpen: (dir: "left" | "right", close: () => void) => void;
}) {
  const open = useSharedValue(expanded ? 1 : 0);
  React.useEffect(() => {
    open.value = withTiming(expanded ? 1 : 0, { duration: 260 });
  }, [expanded, open]);

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: open.value * ACC_EXPAND,
    opacity: open.value,
  }));

  const tone = getStatusTone(item);
  const canSend =
    item.status === "active" &&
    item.messages?.some((m) => m.status === "pending");
  const canStop = item.status === "active";

  return (
    <Swipeable
      friction={2}
      enabled={canSend || canStop}
      renderLeftActions={canSend ? renderLeftActions : undefined}
      renderRightActions={canStop ? renderRightActions : undefined}
      onSwipeableWillOpen={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onSwipeableOpen={(dir, methods) => {
        onSwipeOpen(dir, () => methods.close());
      }}
    >
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.97 },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.jobTitle || "Unknown job"}
            </Text>
            {item.viewed ? (
              <View style={styles.viewedBadge}>
                <Ionicons name="eye" size={12} color={colors.accentText} />
                <Text style={styles.viewedText}>VIEWED</Text>
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: toneBg[tone] },
            ]}
          >
            <Text style={[styles.statusPillText, { color: toneFg[tone] }]}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaMuted}>
            Sent: {item.createdAt ? getRelativeTime(item.createdAt) : "—"}
          </Text>
          <Text style={[styles.metaNext, { color: toneFg[tone] }]}>
            Next: {getNextText(item)}
          </Text>
        </View>
        <Text style={styles.expandHint}>
          {expanded ? "Tap to collapse" : "Tap for Day 3 / 7 / 14"}
        </Text>
        <Animated.View style={[styles.accordionInner, bodyStyle]}>
          {(item.messages ?? []).map((m) => (
            <MessageDayRow key={m.day} msg={m} onPreview={onPreview} />
          ))}
        </Animated.View>
      </Pressable>
    </Swipeable>
  );
}

export function SequencesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest } = useAuth();
  const qc = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSequences();

  const sequences = data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewMsg, setPreviewMsg] = useState<FollowUpMessage | null>(null);

  const sendNow = useMutation({
    mutationFn: async (sequenceId: string) => {
      try {
        await serverApi.request(`/api/sequences/${sequenceId}/send-now`, {
          method: "POST",
        });
      } catch (e) {
        const err = e as { message?: string };
        throw new Error(
          typeof err.message === "string" ? err.message : "Failed to send"
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sequences"] }),
  });

  const stopSeq = useMutation({
    mutationFn: async (sequenceId: string) => {
      try {
        await serverApi.request(`/api/sequences/${sequenceId}/stop`, {
          method: "PUT",
        });
      } catch (e) {
        const err = e as { message?: string };
        throw new Error(
          typeof err.message === "string" ? err.message : "Failed to stop"
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sequences"] }),
  });

  const stats = useMemo(() => {
    const active = sequences.filter((s) => s.status === "active").length;
    const replies = sequences.filter((s) => s.status === "replied").length;
    const shortlisted = sequences.filter(
      (s) => s.viewed && s.status === "active"
    ).length;
    return { active, replies, shortlisted };
  }, [sequences]);

  const renderSend = useCallback(
    () => (
      <View style={styles.actionSend}>
        {isGuest ? (
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={colors.textDim}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Ionicons name="send" size={18} color={colors.success} />
        <Text style={styles.actionSendTxt}>Send Now</Text>
      </View>
    ),
    [isGuest]
  );

  const renderStop = useCallback(
    () => (
      <View style={styles.actionStop}>
        {isGuest ? (
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={colors.textDim}
            style={{ marginRight: 4 }}
          />
        ) : null}
        <Ionicons name="stop-circle" size={18} color={colors.danger} />
        <Text style={styles.actionStopTxt}>Stop</Text>
      </View>
    ),
    [isGuest]
  );

  const onSwipeOpen = useCallback(
    (sequenceId: string, canSend: boolean, canStop: boolean) =>
      (dir: "left" | "right", close: () => void) => {
        if (isGuest) {
          router.push("/auth/register");
          close();
          return;
        }
        if (dir === "left" && canSend) {
          sendNow.mutate(sequenceId, {
            onSettled: () => close(),
          });
        } else if (dir === "right" && canStop) {
          stopSeq.mutate(sequenceId, {
            onSettled: () => close(),
          });
        } else close();
      },
    [sendNow, stopSeq, isGuest, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FollowUpSequence }) => {
      const sid = String(item._id);
      const canSend =
        item.status === "active" &&
        item.messages?.some((m) => m.status === "pending");
      const canStop = item.status === "active";

      return (
        <SequenceCard
          item={item}
          expanded={expandedId === sid}
          onToggle={() =>
            setExpandedId((cur) => (cur === sid ? null : sid))
          }
          onPreview={setPreviewMsg}
          renderLeftActions={renderSend}
          renderRightActions={renderStop}
          onSwipeOpen={onSwipeOpen(sid, !!canSend, canStop)}
        />
      );
    },
    [expandedId, renderSend, renderStop, onSwipeOpen]
  );

  if (isLoading && data === undefined) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadSub}>Loading sequences…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.err}>Failed to load sequences.</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 8 }]}>
      <FlatList
        data={sequences}
        keyExtractor={(s) => String(s._id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.blurb}>
              Automated follow-ups for{" "}
              <Text style={styles.blurbAccent}>
                {stats.active} active
              </Text>{" "}
              sequence{stats.active === 1 ? "" : "s"}
            </Text>
            {isGuest ? (
              <Text style={styles.guestBanner}>
                Sign up to see your real follow-up sequences.
              </Text>
            ) : null}
            <StatsRow
              active={stats.active}
              replies={stats.replies}
              shortlisted={stats.shortlisted}
            />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={40} color={colors.textDim} />
              <Text style={styles.emptyTitle}>No active sequences</Text>
              <Text style={styles.emptySub}>
                Sequences appear when you mark proposals as sent.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          flexGrow: 1,
        }}
      />

      <Modal visible={!!previewMsg} transparent animationType="fade">
        <View style={styles.previewRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPreviewMsg(null)}
          />
          <View style={styles.previewSheet}>
            <Text style={styles.previewTitle}>
              Day {previewMsg?.day} follow-up draft
            </Text>
            <ScrollView style={styles.previewScroll}>
              <Text style={styles.previewBody}>
                {previewMsg?.content || "No content"}
              </Text>
            </ScrollView>
            <Pressable
              style={styles.previewClose}
              onPress={() => setPreviewMsg(null)}
            >
              <Text style={styles.previewCloseTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
  },
  loadSub: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  err: {
    color: colors.danger,
    marginBottom: 12,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
  header: { marginBottom: 14 },
  blurb: { fontSize: 13, color: colors.textMuted, marginBottom: 12, fontFamily: fonts.regular },
  blurbAccent: { color: colors.accent, fontFamily: fonts.semiBold },
  guestBanner: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  statsRow: { flexDirection: "row", gap: 10, paddingBottom: 4 },
  statCard: {
    width: 118,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
  },
  statVal: { fontSize: 22, fontFamily: fonts.bold, color: colors.text },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontFamily: fonts.medium },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    overflow: "hidden",
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.text },
  viewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  viewedText: { fontSize: 10, color: colors.accentText, fontFamily: fonts.semiBold },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontFamily: fonts.medium },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  metaMuted: { fontSize: 12, color: colors.textMuted },
  metaNext: { fontSize: 12, fontFamily: fonts.medium },
  expandHint: { fontSize: 11, color: colors.textDim, marginBottom: 4 },
  accordionInner: { overflow: "hidden" },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayLeft: { flex: 1 },
  dayTitle: { fontSize: 13, color: colors.text, fontFamily: fonts.medium },
  dayStatus: { fontSize: 12, marginTop: 2, fontFamily: fonts.regular },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBtnText: { fontSize: 12, color: colors.accent, fontFamily: fonts.medium },
  actionSend: {
    width: 96,
    minHeight: 44,
    backgroundColor: colors.successDim,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  actionSendTxt: { color: colors.success, fontSize: 11, fontFamily: fonts.semiBold },
  actionStop: {
    width: 88,
    minHeight: 44,
    backgroundColor: `${colors.danger}22`,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  actionStopTxt: { color: colors.danger, fontSize: 11, fontFamily: fonts.semiBold },
  empty: { paddingVertical: 48, alignItems: "center" },
  emptyTitle: { fontSize: 18, color: colors.text, marginTop: 12, fontFamily: fonts.semiBold },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 8, paddingHorizontal: 24 },
  previewRoot: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.overlay,
    paddingHorizontal: 20,
  },
  previewSheet: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "72%",
  },
  previewTitle: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 10 },
  previewScroll: { maxHeight: 320 },
  previewBody: { fontSize: 14, color: colors.textMuted, lineHeight: 22, fontFamily: fonts.regular },
  previewClose: {
    alignSelf: "center",
    marginTop: 14,
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  previewCloseTxt: { fontSize: 15, color: colors.accent, fontFamily: fonts.semiBold },
});
