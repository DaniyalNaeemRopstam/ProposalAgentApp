import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { Button } from "../../components/ui/Button";
import { colors } from "../../theme/colors";

export function ProposalsScreen() {
  const [proposal, setProposal] = useState(`Hi StartupCo,

I noticed you need a senior React Native developer for your FinTech MVP — I built something very similar for KPK Government's healthcare platform, and I know exactly what it takes to get this right.

Here's how I'd approach your project:

**Week 1–2:** Architecture setup, auth flow, and core screens
**Week 3–5:** Main feature development + API integration  
**Week 6–7:** Testing, performance optimization, App Store prep
**Week 8:** Launch support + handoff documentation

A few things that make me the right fit:
→ 7+ years React Native — I've shipped apps to 100k+ government users
→ MERN stack full-stack capability — I handle both ends
→ US LLC (DanielForge Technologies) — proper contract + USD invoicing

My fixed price for this scope: **$12,000** with 3 milestones so you only pay as we hit targets.

Can we jump on a 15-minute call this week to confirm scope?

Daniyal Naeem | DanielForge Technologies LLC`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Proposal Writer</Text>
        <Text style={styles.subtitle}>
          Generated for: Senior React Native Developer
        </Text>
      </View>

      <View style={styles.jobCard}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>Senior React Native Developer</Text>
          <Text style={styles.jobMeta}>Upwork · $8,000–$15,000 · 🇺🇸 USA</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>94</Text>
        </View>
      </View>

      <View style={styles.proposalContainer}>
        <View style={styles.proposalHeader}>
          <Text style={styles.proposalLabel}>AI-generated proposal · Edit before sending</Text>
        </View>
        
        <TextInput
          style={styles.proposalInput}
          value={proposal}
          onChangeText={setProposal}
          multiline
          placeholder="Your proposal will appear here..."
          placeholderTextColor={colors.textDim}
        />

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Word count</Text>
            <Text style={styles.metricValue}>{proposal.split(" ").length} words</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Read time</Text>
            <Text style={styles.metricValue}>45 sec</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Win probability</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>~68%</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Regenerate"
            variant="ghost"
            size="small"
          />
          <Button
            title="Copy Proposal"
            size="small"
          />
        </View>
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
  jobCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  scoreContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successDim,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
  },
  proposalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proposalHeader: {
    marginBottom: 12,
  },
  proposalLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  proposalInput: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    minHeight: 200,
    textAlignVertical: "top",
    backgroundColor: colors.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metric: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});