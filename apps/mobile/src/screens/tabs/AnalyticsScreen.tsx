import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { colors } from "../../theme/colors";

export function AnalyticsScreen() {
  const platformData = [
    { label: "Upwork", val: 14, pct: 61, color: colors.success },
    { label: "LinkedIn", val: 6, pct: 26, color: colors.accent },
    { label: "Wellfound", val: 3, pct: 13, color: colors.purple },
  ];

  const tierData = [
    { label: "Tier A ($2k–$5k)", rate: 22, color: colors.teal },
    { label: "Tier B ($5k–$15k)", rate: 18, color: colors.accent },
    { label: "Tier C ($15k–$50k)", rate: 8, color: colors.purple },
  ];

  const insights = [
    {
      type: "positive",
      text: "Proposals under 180 words have 2.4x higher reply rate than longer ones",
    },
    {
      type: "positive", 
      text: "Jobs posted under 2 hours ago have 3x higher win rate — apply faster",
    },
    {
      type: "suggestion",
      text: "Mentioning government client experience increases Tier C shortlist rate by 40%",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance insights and metrics</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>PROPOSALS BY PLATFORM</Text>
          {platformData.map((item) => (
            <View key={item.label} style={styles.chartItem}>
              <View style={styles.chartRow}>
                <Text style={styles.chartLabel}>{item.label}</Text>
                <Text style={styles.chartValue}>{item.val} sent · {item.pct}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: item.color, width: `${item.pct}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>WIN RATE BY BUDGET TIER</Text>
          {tierData.map((item) => (
            <View key={item.label} style={styles.chartItem}>
              <View style={styles.chartRow}>
                <Text style={styles.chartLabel}>{item.label}</Text>
                <Text style={[styles.chartValue, { color: item.color, fontWeight: "600" }]}>
                  {item.rate}% win rate
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: item.color, width: `${item.rate * 4}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI INSIGHTS — WHAT'S WORKING</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={styles.insightIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  halfCard: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartItem: {
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  chartLabel: {
    fontSize: 13,
    color: colors.text,
  },
  chartValue: {
    fontSize: 13,
    color: colors.textMuted,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 10,
  },
  insightIcon: {
    width: 16,
    height: 16,
    marginRight: 10,
    marginTop: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  insightText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
});