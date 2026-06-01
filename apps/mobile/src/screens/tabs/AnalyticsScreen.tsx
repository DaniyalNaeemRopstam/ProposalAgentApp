import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../components/ui/Button";
import {
  type AIInsight,
  type MonthlyData,
  useAnalyticsInsights,
  useAnalyticsMonthly,
  useAnalyticsOverview,
  useAnalyticsPlatforms,
  useRefreshAllAnalytics,
} from "../../hooks/useAnalytics";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const INSIGHT_BORDER: Record<AIInsight["type"], string> = {
  positive: colors.success,
  warning: colors.warn,
  suggestion: colors.accentText,
};

const STAT_GAP = 12;

type StatTile = {
  key: string;
  label: string;
  value: string;
  hint?: string;
};

function formatMonthLabel(raw: string): string {
  const m = raw.match(/^(\d{4})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    return d.toLocaleString("en-US", { month: "short" });
  }
  if (raw.length >= 3) return raw.slice(0, 3);
  return raw;
}

function parsePct(raw: string): number {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

function lastUpdatedMinutesAgo(timestamps: number[]): string {
  const ts = Math.max(0, ...timestamps.filter((t) => t > 0));
  if (!ts) return "—";
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  return `${mins} min ago`;
}

function MonthlyBars(props: {
  data: MonthlyData[];
  chartW: number;
}) {
  const PAD_TOP = 8;
  const PLOT_H = 132;
  const svgH = PAD_TOP + PLOT_H;

  const n = Math.max(1, props.data.length);
  const maxSent = Math.max(1, ...props.data.map((d) => d.sent));
  const slotW = props.chartW / n;
  const baseY = PAD_TOP + PLOT_H;

  return (
    <Svg width={props.chartW} height={svgH}>
      {props.data.map((m, i) => {
        const x = i * slotW + slotW * 0.18;
        const barW = slotW * 0.64;
        const hSent = (m.sent / maxSent) * PLOT_H;
        const wonFrac = m.sent > 0 ? Math.min(1, m.won / m.sent) : 0;
        const hWon = hSent * wonFrac;
        return (
          <React.Fragment key={m.month}>
            <Rect
              x={x}
              y={baseY - hSent}
              width={barW}
              height={hSent}
              rx={4}
              ry={4}
              fill={colors.textDim}
              opacity={0.45}
            />
            <Rect
              x={x}
              y={baseY - hWon}
              width={barW}
              height={hWon}
              rx={4}
              ry={4}
              fill={colors.success}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  return (
    <View
      style={[
        styles.insightCard,
        { borderLeftColor: INSIGHT_BORDER[insight.type] },
      ]}
    >
      <Text style={styles.insightText}>{insight.text}</Text>
    </View>
  );
}

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGuest } = useAuth();
  const { width: winW } = useWindowDimensions();
  const horizontalPad = 16;
  const innerCardPad = 16;
  const chartW = winW - horizontalPad * 2 - innerCardPad * 2;

  const overview = useAnalyticsOverview();
  const monthly = useAnalyticsMonthly();
  const platforms = useAnalyticsPlatforms();
  const insights = useAnalyticsInsights();
  const refreshAll = useRefreshAllAnalytics();

  const statTiles: StatTile[] = useMemo(() => {
    const o = overview.data;
    if (!o) return [];
    return [
      {
        key: "sent",
        label: "Proposals sent",
        value: String(o.proposalsSent),
      },
      {
        key: "replies",
        label: "Replies",
        value: String(o.repliesReceived),
      },
      {
        key: "won",
        label: "Projects won",
        value: String(o.projectsWon),
      },
      {
        key: "win",
        label: "Win rate",
        value:
          typeof o.winRate === "number" && !Number.isNaN(o.winRate)
            ? `${o.winRate.toFixed(1)}%`
            : "—",
      },
    ];
  }, [overview.data]);

  const tilesWithWidth = Math.max(
    0,
    (winW - horizontalPad * 2 - STAT_GAP) / 2
  );

  const lastLbl = lastUpdatedMinutesAgo([
    overview.dataUpdatedAt,
    monthly.dataUpdatedAt,
    platforms.dataUpdatedAt,
    insights.dataUpdatedAt,
  ]);

  const isBootLoading =
    (overview.isLoading && !overview.data) ||
    (monthly.isLoading && !monthly.data) ||
    (platforms.isLoading && !platforms.data) ||
    (insights.isLoading && !insights.data);

  const analyticsError =
    overview.isError || monthly.isError || platforms.isError || insights.isError;

  const errMsg = [
    overview.error,
    monthly.error,
    platforms.error,
    insights.error,
  ].find((e) => e instanceof Error)?.message;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl
          refreshing={refreshAll.isPending}
          onRefresh={() => refreshAll.mutate()}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance overview</Text>
      </View>

      {analyticsError ? (
        <View style={styles.errRow}>
          <Text style={styles.errBanner}>
            {errMsg ?? "Some analytics failed to load."}
          </Text>
          <Button
            title="Retry"
            variant="ghost"
            onPress={() => refreshAll.mutate()}
            loading={refreshAll.isPending}
          />
        </View>
      ) : null}

      {isBootLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      {!isBootLoading &&
      !analyticsError &&
      overview.data &&
      overview.data.proposalsSent === 0 ? (
        <Text style={[styles.emptyNote, styles.emptyNoteBottom]}>
          No proposal activity recorded yet — send your first proposal to see
          trends here.
        </Text>
      ) : null}

      <Text style={styles.sectionTitle}>Key metrics</Text>
      <FlatList
        data={statTiles}
        numColumns={2}
        scrollEnabled={false}
        keyExtractor={(i) => i.key}
        columnWrapperStyle={styles.statsRow}
        contentContainerStyle={styles.statsList}
        renderItem={({ item }) => (
          <View style={[styles.statTile, { width: tilesWithWidth }]}>
            <Text style={styles.statVal}>{item.value}</Text>
            <Text style={styles.statLbl}>{item.label}</Text>
            {item.hint ? (
              <Text style={styles.statHint}>{item.hint}</Text>
            ) : null}
          </View>
        )}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sent vs wins (monthly)</Text>
        {monthly.data && monthly.data.length > 0 ? (
          <>
            <MonthlyBars data={monthly.data} chartW={chartW} />
            <View style={[styles.monthRow, { width: chartW }]}>
              {monthly.data.map((m) => (
                <View
                  key={m.month}
                  style={{ width: chartW / Math.max(1, monthly.data!.length) }}
                >
                  <Text style={styles.monthLbl} numberOfLines={1}>
                    {formatMonthLabel(m.month)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.chartLegend}>
              <Text style={{ color: colors.textDim }}>Sent </Text>
              <Text style={{ color: colors.success }}>· Wins</Text>
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>No monthly data yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>By platform</Text>
        {platforms.data && platforms.data.length > 0 ? (
          platforms.data.map((p) => {
            const pct = parsePct(p.percentage);
            const fill = p.color || colors.accent;
            return (
              <View key={p.platform} style={styles.platformBlock}>
                <View style={styles.platformTop}>
                  <Text style={styles.platformName}>{p.platform}</Text>
                  <Text style={styles.platformMeta}>
                    {p.count} sent · {p.percentage}
                  </Text>
                </View>
                <View style={styles.platformTrack}>
                  <View
                    style={[
                      styles.platformFillAbs,
                      {
                        width: `${pct}%`,
                        backgroundColor: fill,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.platformWin}>
                  {p.winRate} win rate
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No platform breakdown yet.</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>AI insights</Text>
      <View style={styles.insightsWrap}>
        <FlatList
          data={insights.data ?? []}
          scrollEnabled={false}
          nestedScrollEnabled
          keyExtractor={(item, index) => `${index}-${item.text.slice(0, 24)}`}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          style={[styles.insightsList, isGuest && { opacity: 0.38 }]}
          renderItem={({ item }) => <InsightCard insight={item} />}
          ListEmptyComponent={
            !insights.isLoading ? (
              <Text style={styles.muted}>No insights yet.</Text>
            ) : null
          }
        />
        {isGuest ? (
          <View style={styles.insightsOverlay}>
            <Text style={styles.insightsOverlayTitle}>Unlock AI coaching insights</Text>
            <Button
              title="Sign up free to see your insights"
              variant="primary"
              onPress={() => router.push("/auth/register")}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.lastUpdated}>Last updated {lastLbl}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  errBanner: {
    color: colors.danger,
    fontFamily: fonts.regular,
    marginBottom: 12,
    fontSize: 13,
  },
  errRow: {
    marginBottom: 12,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  statsList: {
    paddingBottom: 8,
  },
  statsRow: {
    gap: STAT_GAP,
    marginBottom: STAT_GAP,
  },
  statTile: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statVal: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLbl: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginTop: 6,
  },
  statHint: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  monthRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  monthLbl: {
    fontSize: 10,
    color: colors.textDim,
    textAlign: "center",
    fontFamily: fonts.medium,
  },
  chartLegend: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 10,
    color: colors.textMuted,
  },
  muted: {
    fontSize: 13,
    color: colors.textDim,
    fontFamily: fonts.regular,
  },
  emptyNote: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 19,
    backgroundColor: colors.surfaceHover,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyNoteBottom: {
    marginBottom: 16,
  },
  platformBlock: {
    marginBottom: 14,
  },
  platformTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  platformName: {
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  platformMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  platformTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  platformFillAbs: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  platformWin: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 4,
    fontFamily: fonts.regular,
  },
  insightsList: {
    marginBottom: 8,
  },
  insightsWrap: {
    position: "relative",
    marginBottom: 8,
    minHeight: 120,
  },
  insightsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 9, 15, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
    borderRadius: 12,
  },
  insightsOverlayTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  insightText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.textDim,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
});
