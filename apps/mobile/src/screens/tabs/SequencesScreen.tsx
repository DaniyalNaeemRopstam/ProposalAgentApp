import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { colors } from "../../theme/colors";

export function SequencesScreen() {
  const sequences = [
    {
      job: "Senior React Native — FinTech MVP",
      sent: "2 days ago",
      status: "Awaiting reply",
      next: "Day 7 follow-up in 5 days",
      color: colors.warn,
    },
    {
      job: "CTO-for-Hire: SaaS Platform",
      sent: "4 hours ago",
      status: "Proposal viewed",
      next: "Day 3 follow-up in 2 days",
      color: colors.accent,
    },
    {
      job: "Healthcare React Native App",
      sent: "1 day ago",
      status: "Shortlisted",
      next: "Call scheduled — no follow-up needed",
      color: colors.success,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-up Sequences</Text>
        <Text style={styles.subtitle}>
          Automated follow-up sequences for{" "}
          <Text style={styles.accent}>3 active proposals</Text>
        </Text>
      </View>

      {sequences.map((sequence, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.jobTitle}>{sequence.job}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${sequence.color}20` }]}>
              <Text style={[styles.statusText, { color: sequence.color }]}>
                {sequence.status}
              </Text>
            </View>
          </View>

          <View style={styles.timeline}>
            <Text style={styles.timelineItem}>
              <Text style={styles.label}>Sent:</Text> {sequence.sent}
            </Text>
            <Text style={[styles.timelineItem, { color: sequence.color }]}>
              <Text style={styles.label}>Next:</Text> {sequence.next}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Preview follow-up"
              variant="ghost"
              size="small"
            />
            <Button
              title="Send now"
              variant="ghost"
              size="small"
            />
          </View>
        </View>
      ))}
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
    lineHeight: 20,
  },
  accent: {
    color: colors.accent,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  timeline: {
    marginBottom: 12,
    gap: 4,
  },
  timelineItem: {
    fontSize: 12,
    color: colors.textMuted,
  },
  label: {
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});