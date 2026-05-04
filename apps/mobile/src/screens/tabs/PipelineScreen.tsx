import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { colors } from "../../theme/colors";

export function PipelineScreen() {
  const stages = [
    { 
      name: "Applied", 
      count: 8, 
      color: colors.accent,
      deals: [
        { title: "SaaS MVP Build", client: "TechCorp", budget: "$15k" },
        { title: "E-commerce App", client: "RetailCo", budget: "$8k" },
      ]
    },
    { 
      name: "Replied", 
      count: 3, 
      color: colors.teal,
      deals: [
        { title: "Healthcare Platform", client: "MedTech", budget: "$25k" },
      ]
    },
    { 
      name: "Discovery", 
      count: 2, 
      color: colors.purple,
      deals: [
        { title: "Financial Dashboard", client: "FinCorp", budget: "$12k" },
      ]
    },
    { 
      name: "Won", 
      count: 1, 
      color: colors.success,
      deals: [
        { title: "Government Portal", client: "KPK Govt", budget: "$75k" },
      ]
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CRM Pipeline</Text>
        <Text style={styles.subtitle}>
          Track deals from <Text style={styles.accent}>applied</Text> to{" "}
          <Text style={styles.success}>won</Text>
        </Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pipelineContainer}
      >
        {stages.map((stage, stageIndex) => (
          <View key={stageIndex} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={styles.columnTitleRow}>
                <View style={[styles.dot, { backgroundColor: stage.color }]} />
                <Text style={[styles.columnTitle, { color: stage.color }]}>
                  {stage.name.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.columnCount}>{stage.count}</Text>
            </View>

            <View style={styles.columnContent}>
              {stage.deals.length === 0 ? (
                <View style={styles.emptyColumn}>
                  <Text style={styles.emptyText}>Drop deals here</Text>
                </View>
              ) : (
                stage.deals.map((deal, dealIndex) => (
                  <View key={dealIndex} style={styles.dealCard}>
                    <Text style={styles.dealTitle}>{deal.title}</Text>
                    <Text style={styles.dealBudget}>{deal.budget}</Text>
                    <Text style={styles.dealClient}>{deal.client}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
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
  success: {
    color: colors.success,
    fontWeight: "600",
  },
  pipelineContainer: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  column: {
    width: 200,
    backgroundColor: "#0f1116",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  columnTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  columnCount: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textDim,
  },
  columnContent: {
    padding: 12,
    minHeight: 120,
    gap: 12,
  },
  emptyColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
  },
  emptyText: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: "center",
  },
  dealCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  dealBudget: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.success,
    marginBottom: 4,
  },
  dealClient: {
    fontSize: 12,
    color: colors.textMuted,
  },
});