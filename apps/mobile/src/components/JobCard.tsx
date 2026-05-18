import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, Linking } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { Job } from "@proposalagent/shared";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";
import { ScoreRing } from "./ScoreRing";
import { Button } from "./ui/Button";

const EXPAND_MAX = 720;

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, [string, string]> = {
    Upwork: [colors.success, colors.successDim],
    LinkedIn: [colors.accent, colors.accentDim],
    Wellfound: [colors.purple, colors.purpleDim],
  };
  const [fg, bg] = map[platform] ?? [colors.textMuted, colors.border];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>
        {platform.toUpperCase()}
      </Text>
    </View>
  );
}

function SourceBadge({ isAggregated }: { isAggregated?: boolean }) {
  const isTeal = isAggregated === true;
  const isPurple = isAggregated === false;

  if (!isTeal && !isPurple) return null;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isTeal ? colors.accentDim : colors.purpleDim,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: isTeal ? colors.accentText : colors.purple,
          },
        ]}
      >
        {isTeal ? "AUTO" : "MANUAL"}
      </Text>
    </View>
  );
}

export type JobCardProps = {
  job: Job;
  expanded: boolean;
  onToggleExpand: () => void;
  onGenerateProposal: () => void;
  onSkip: () => void;
  savedHighlight?: boolean;
  /** When true: disables proposal generation UI (offline). */
  offline?: boolean;
};

export function JobCard({
  job,
  expanded,
  onToggleExpand,
  onGenerateProposal,
  onSkip,
  savedHighlight,
  offline,
}: JobCardProps) {
  const open = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    open.value = withTiming(expanded ? 1 : 0, { duration: 280 });
  }, [expanded, open]);

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: open.value * EXPAND_MAX,
    opacity: interpolate(open.value, [0, 0.35, 1], [0, 0.6, 1]),
  }));

  const client = job.client;

  return (
    <View
      style={[
        styles.card,
        savedHighlight && { borderColor: colors.success, borderWidth: 1 },
      ]}
    >
      <Pressable
        onPress={onToggleExpand}
        style={({ pressed }) => [styles.tapHead, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.row1}>
          <ScoreRing score={job.score} size={48} />
          <View style={styles.headMain}>
            <View style={styles.titleRow}>
              <PlatformBadge platform={job.platform} />
              {job.isDemo ? (
                <View style={[styles.badge, { backgroundColor: colors.surfaceHover }]}>
                  <Text style={[styles.badgeText, { color: colors.textDim }]}>DEMO</Text>
                </View>
              ) : null}
              <SourceBadge isAggregated={job.isAggregated} />
              <Text style={styles.title} numberOfLines={2}>
                {job.title}
              </Text>
            </View>
            <View style={styles.row2}>
              <Text style={styles.budget}>{job.budget}</Text>
              <Text style={styles.metaMuted}> · </Text>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaMuted}> {job.posted}</Text>
              <Text style={styles.metaMuted}> · {client.country}</Text>
              {job.competition ? (
                <Text style={styles.metaMuted}> · {job.competition}</Text>
              ) : null}
              {client.rating != null ? (
                <Text style={styles.rating}>
                  {" "}
                  · ★ {client.rating}
                </Text>
              ) : null}
            </View>
            <Text style={styles.snippet} numberOfLines={2} ellipsizeMode="tail">
              {job.snippet}
            </Text>
          </View>
        </View>
      </Pressable>

      <Animated.View style={[styles.expanded, bodyStyle]}>
        <View style={styles.clientGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>CLIENT</Text>
            <Text style={styles.gridValue}>{client.name}</Text>
            <Text style={styles.gridLabel}>SPENT / SIGNAL</Text>
            <Text style={styles.gridValue}>
              {client.spent ?? "—"}
            </Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.gridLabel}>COUNTRY</Text>
            <Text style={styles.gridValue}>{client.country}</Text>
            <Text style={styles.gridLabel}>RATING / HIRES</Text>
            <Text style={styles.gridValue}>
              {client.rating != null ? `${client.rating}` : "—"}
              {client.hires != null ? ` · ${client.hires} hires` : ""}
            </Text>
          </View>
        </View>

        {job.tags?.length ? (
          <View style={styles.tags}>
            {job.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {job.sourceUrl ? (
          <Button
            title={`Open in ${job.platform} ↗`}
            variant="ghost"
            onPress={() => Linking.openURL(job.sourceUrl!)}
            style={styles.viewOriginalBtn}
          />
        ) : null}

        {job.reasons?.length ? (
          <View style={styles.whyBox}>
            <Text style={styles.whyTitle}>WHY YOU SHOULD APPLY</Text>
            {job.reasons.map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.success}
                  style={styles.reasonIcon}
                />
                <Text style={styles.reasonText}>{r}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          title="Generate Proposal"
          disabled={offline}
          onPress={onGenerateProposal}
          style={styles.genBtn}
          accessibilityHint={
            offline
              ? "Internet required to generate proposals"
              : undefined
          }
        />
        {offline ? (
          <Text style={styles.offlineHint}>
            Internet required to generate proposals.
          </Text>
        ) : null}
        <Button title="Skip" variant="ghost" onPress={onSkip} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    overflow: "hidden",
  },
  tapHead: {},
  row1: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headMain: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  title: {
    flex: 1,
    minWidth: "55%",
    fontSize: 15,
    fontFamily: fonts.semiBold,
    fontWeight: "600",
    color: colors.text,
  },
  row2: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
    gap: 2,
  },
  budget: {
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: "500",
    color: colors.success,
  },
  metaMuted: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  rating: {
    fontSize: 12,
    color: colors.warn,
    fontFamily: fonts.medium,
  },
  snippet: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  expanded: {
    overflow: "hidden",
    paddingTop: 4,
  },
  clientGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  gridCol: { flex: 1 },
  gridLabel: {
    fontSize: 10,
    color: colors.textDim,
    fontFamily: fonts.medium,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  gridValue: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    marginBottom: 10,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    fontWeight: "500",
    color: colors.accentText,
  },
  whyBox: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  whyTitle: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.textDim,
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 6,
  },
  reasonIcon: { marginTop: 1 },
  reasonText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  genBtn: {
    marginBottom: 4,
    marginTop: 6,
  },
  viewOriginalBtn: {
    marginBottom: 8,
  },
  offlineHint: {
    marginTop: 2,
    marginBottom: 8,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.warnText,
  },
});
