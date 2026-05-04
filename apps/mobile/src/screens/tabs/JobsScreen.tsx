import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../theme/colors";
import { useJobs } from "../../hooks/useJobs";
import { Button } from "../../components/ui/Button";

export function JobsScreen() {
  const { data: jobs, isLoading, error, refetch } = useJobs();

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading job matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load jobs</Text>
        <Button title="Retry" onPress={() => refetch()} size="small" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Job Matches</Text>
        <Text style={styles.subtitle}>
          {jobs && jobs.length > 0 ? (
            <>AI found <Text style={styles.accent}>{jobs.length} high-fit jobs</Text> in the last 2 hours</>
          ) : (
            "No job matches yet. Connect your platforms to get started."
          )}
        </Text>
      </View>

      {jobs && jobs.length > 0 ? (
        jobs.map((job, index) => (
          <View key={job._id || index} style={[styles.card, index > 0 && { marginTop: 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{job.aiScore || 85}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobBudget}>{job.budget}</Text>
                <Text style={styles.jobMeta}>
                  {job.platform} · {job.postedAt} · 🌍 {job.clientCountry}
                </Text>
              </View>
            </View>
            
            <Text style={styles.jobSnippet} numberOfLines={2}>
              {job.description}
            </Text>
            
            <View style={styles.tags}>
              {job.tags?.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Generate AI Proposal"
              size="small"
              style={styles.generateButton}
              onPress={() => {
                // Navigate to proposals tab with this job
                console.log("Generate proposal for job:", job.title);
              }}
            />
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Jobs Yet</Text>
          <Text style={styles.emptyText}>
            Connect your Upwork, LinkedIn, or other platforms to start finding perfect-fit jobs automatically.
          </Text>
          <Button title="Connect Platform" style={styles.connectButton} />
        </View>
      )}
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
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  scoreContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successDim,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.success,
  },
  cardInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  jobBudget: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.success,
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  jobSnippet: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.accentText,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: 16,
    textAlign: "center",
  },
  generateButton: {
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  connectButton: {
    minWidth: 140,
  },
});