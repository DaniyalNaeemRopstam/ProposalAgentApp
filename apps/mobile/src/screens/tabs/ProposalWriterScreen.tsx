import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { ApiError } from "@proposalagent/api-client";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { ScoreRing } from "../../components/ScoreRing";
import { useJob } from "../../hooks/useJob";
import { useJobs } from "../../hooks/useJobs";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { serverApi } from "../../lib/api";
import { requestMarkProposalSent } from "../../lib/markProposalSentApi";
import {
  enqueueMarkProposalSent,
  isLikelyNetworkFailure,
} from "../../lib/pendingMutations";
import {
  type ApiJobRecord,
  type GenerateEnvelope,
  type ProposalMode,
  type ProposalVariant,
  buildGenerateBody,
  jobScore,
  mapPlatformToMode,
  normalizeJobId,
} from "../../lib/proposalApiHelpers";
import { streamProposalContent } from "../../lib/streamProposal";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const MODE_OPTIONS: { key: ProposalMode; label: string }[] = [
  { key: "upwork", label: "Upwork" },
  { key: "linkedin", label: "LinkedIn DM" },
  { key: "email", label: "Cold Email" },
];

const VARIANT_OPTIONS: { key: ProposalVariant; label: string }[] = [
  { key: "quality", label: "Quality" },
  { key: "price", label: "Price" },
  { key: "speed", label: "Speed" },
];

const STEPS = [
  "Researching client background",
  "Analyzing your best-fit projects",
  "Crafting personalized opening hook",
  "Building milestone structure",
  "Optimizing for reply rate",
];

export default function ProposalWriterScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const net = useNetworkStatus();
  const offline =
    net.isConnected === false || net.isInternetReachable === false;

  const { jobId: rawJobId } = useLocalSearchParams<{ jobId?: string }>();
  const jobId = rawJobId != null && String(rawJobId).trim() !== ""
    ? String(rawJobId).trim()
    : "";

  const mainScrollRef = useRef<ScrollView>(null);

  const s0 = useRef(new Animated.Value(0.35)).current;
  const s1 = useRef(new Animated.Value(0.35)).current;
  const s2 = useRef(new Animated.Value(0.35)).current;
  const s3 = useRef(new Animated.Value(0.35)).current;
  const s4 = useRef(new Animated.Value(0.35)).current;
  const stepOps = [s0, s1, s2, s3, s4];

  const { data: job, isLoading, isError, error, refetch } = useJob(
    jobId || undefined
  );
  const { data: jobList = [] } = useJobs("all");

  const [mode, setMode] = useState<ProposalMode>("upwork");
  const [variant, setVariant] = useState<ProposalVariant>("quality");

  const [proposalText, setProposalText] = useState("");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [replyProbability, setReplyProbability] = useState(68);
  const [proposalScore, setProposalScore] = useState<number | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [markLoading, setMarkLoading] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [offlineMarkQueued, setOfflineMarkQueued] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState("");

  const [jobPickerOpen, setJobPickerOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);

  useEffect(() => {
    if (!job?.platform) return;
    setMode(mapPlatformToMode(String(job.platform)));
  }, [job?._id, job?.platform]);

  useEffect(() => {
    setProposalText("");
    setProposalId(null);
    setProposalScore(null);
    setReplyProbability(68);
    setGenerateError(null);
    setCopied(false);
    setMarkError(null);
    setOfflineMarkQueued(false);
  }, [jobId]);

  useEffect(() => {
    stepOps.forEach((v) => v.setValue(0.35));

    if (!generating) return;

    const loops = stepOps.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 220),
          Animated.timing(val, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.35,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      )
    );
    const master = Animated.parallel(loops);
    master.start();

    return () => {
      master.stop();
    };
  }, [generating]);

  const scrollProposalIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollToEnd({ animated: true });
    });
    setTimeout(() => {
      mainScrollRef.current?.scrollToEnd({ animated: true });
    }, 220);
  }, []);

  const runGenerate = useCallback(
    async (source: ApiJobRecord) => {
      const jid = normalizeJobId(source._id) || jobId;
      if (!jid) {
        setGenerateError("Missing job reference.");
        return;
      }

      try {
        const n = await NetInfo.fetch();
        if (n.isConnected === false || n.isInternetReachable === false) {
          setGenerateError("Internet required to generate proposals.");
          return;
        }
      } catch {
        // NetInfo unavailable — attempt request
      }

      setGenerateError(null);
      setMarkError(null);
      setCopied(false);
      setGenerating(true);
      setProposalText("");

      try {
        const body = buildGenerateBody(source, jid, mode, variant);
        const envelope = await serverApi.request<GenerateEnvelope>(
          "/api/proposals/generate",
          {
            method: "POST",
            body,
          }
        );
        const content = envelope.proposal?.content ?? "";
        const rp =
          typeof envelope.replyProbability === "number"
            ? envelope.replyProbability
            : envelope.proposal?.replyProbability ?? 68;
        const ps =
          typeof envelope.proposalScore === "number"
            ? envelope.proposalScore
            : envelope.proposal?.proposalScore ?? null;
        const id = envelope.proposal?._id
          ? String(envelope.proposal._id)
          : null;

        if (id) setProposalId(id);
        setReplyProbability(
          typeof rp === "number" && !Number.isNaN(rp) ? rp : 68
        );
        setProposalScore(
          typeof ps === "number" && !Number.isNaN(ps) ? Math.round(ps) : null
        );

        setGenerating(false);
        await streamProposalContent(content, setProposalText, 12);

        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        scrollProposalIntoView();
      } catch (e) {
        setGenerating(false);
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Proposal generation failed.";
        setGenerateError(msg);
      }
    },
    [jobId, mode, variant, scrollProposalIntoView]
  );

  const wordCount = proposalText.trim()
    ? proposalText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const readSeconds = Math.max(10, Math.round(wordCount / 4.2));

  const copyProposal = async () => {
    if (!proposalText.trim()) return;
    await Clipboard.setStringAsync(proposalText);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markSent = async () => {
    if (!proposalId) return;
    setMarkLoading(true);
    setMarkError(null);
    try {
      const n = await NetInfo.fetch();
      if (n.isConnected === false || n.isInternetReachable === false) {
        await enqueueMarkProposalSent(proposalId);
        setOfflineMarkQueued(true);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        return;
      }

      await requestMarkProposalSent(proposalId);
      setOfflineMarkQueued(false);
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      await qc.invalidateQueries({ queryKey: ["sequences"] });
      await qc.invalidateQueries({ queryKey: ["jobs"] });
      await qc.invalidateQueries({ queryKey: ["job"] });
      await qc.invalidateQueries({ queryKey: ["proposals"] });
    } catch (e) {
      if (isLikelyNetworkFailure(e)) {
        await enqueueMarkProposalSent(proposalId);
        setOfflineMarkQueued(true);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      } else {
        setMarkError(
          e instanceof Error ? e.message : "Could not mark as sent."
        );
      }
    } finally {
      setMarkLoading(false);
    }
  };

  const saveEditedContent = async () => {
    if (!proposalId) {
      setProposalText(editDraft);
      setEditOpen(false);
      return;
    }
    try {
      await serverApi.request<unknown>(
        `/api/proposals/${proposalId}/content`,
        {
          method: "PUT",
          body: { content: editDraft },
        }
      );
      setProposalText(editDraft);
      setEditOpen(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Save failed.";
      setMarkError(msg);
    }
  };

  const openEdit = () => {
    setEditDraft(proposalText);
    setEditOpen(true);
  };

  const pickJob = (id: string) => {
    setJobPickerOpen(false);
    router.replace({
      pathname: "/(tabs)/proposal",
      params: { jobId: id },
    });
  };

  if (!jobId) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, { paddingTop: insets.top }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>Select a job to write a proposal</Text>
          <Text style={styles.emptySub}>
            Browse job matches and pick one to generate with AI.
          </Text>
          <Button
            title="Browse job matches"
            onPress={() => router.push("/(tabs)/jobs")}
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isLoading && !job) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading job…</Text>
      </View>
    );
  }

  if (isError || !job) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 24, paddingHorizontal: 24 }]}>
        <Ionicons name="warning-outline" size={40} color={colors.danger} />
        <Text style={styles.errTitle}>
          {error instanceof Error ? error.message : "Could not load this job."}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
        <Button
          title="Browse job matches"
          variant="ghost"
          onPress={() => router.push("/(tabs)/jobs")}
        />
      </View>
    );
  }

  const title = typeof job.title === "string" ? job.title : "Job";
  const budget = typeof job.budget === "string" ? job.budget : "—";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        ref={mainScrollRef}
        style={styles.flex}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {generateError ? (
          <Text style={styles.bannerErr}>{generateError}</Text>
        ) : null}
        {markError ? (
          <Text style={styles.bannerErr}>{markError}</Text>
        ) : null}

        <Pressable
          onPress={() => setJobPickerOpen(true)}
          style={({ pressed }) => [
            styles.jobCard,
            pressed && { opacity: 0.92 },
          ]}
        >
          <ScoreRing score={jobScore(job)} size={40} />
          <View style={styles.jobCardMid}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.jobBudget}>{budget}</Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.textMuted}
            style={{ marginLeft: 4 }}
          />
        </Pressable>

        <Text style={styles.sectionLabel}>Mode</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {MODE_OPTIONS.map((m) => {
            const on = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[styles.modePill, on && styles.modePillOn]}
              >
                <Text style={[styles.pillText, on && styles.modePillTextOn]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionLabel}>Variant</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {VARIANT_OPTIONS.map((v) => {
            const on = variant === v.key;
            return (
              <Pressable
                key={v.key}
                onPress={() => setVariant(v.key)}
                style={[styles.varPill, on && styles.varPillOn]}
              >
                <Text style={[styles.varPillText, on && styles.varPillTextOn]}>
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          disabled={generating || offline}
          onPress={() => runGenerate(job)}
          style={({ pressed }) => [
            styles.genBig,
            (generating || offline) && styles.genBigDisabled,
            pressed && !generating && !offline && { opacity: 0.92 },
          ]}
        >
          {generating ? (
            <Text style={styles.genBigText}>Working…</Text>
          ) : (
            <Text style={styles.genBigText}>⚡ Generate AI Proposal</Text>
          )}
        </Pressable>
        {offline ? (
          <Text style={styles.offlineGenHint}>
            Internet required to generate proposals.
          </Text>
        ) : null}

        {generating ? (
          <View style={styles.loadBox}>
            <View style={styles.loadHead}>
              <Ionicons name="sparkles" size={22} color={colors.accent} />
              <Text style={styles.loadTitle}>
                Generating personalized proposal…
              </Text>
            </View>
            {STEPS.map((label, i) => (
              <Animated.View
                key={label}
                style={[styles.stepRow, { opacity: stepOps[i] }]}
              >
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>{label}</Text>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {proposalText.trim().length > 0 && !generating ? (
          <View style={styles.resultBlock}>
            <Text style={styles.resultHint}>
              AI-generated proposal · Long-press for options
            </Text>
            <Pressable
              onLongPress={() => setRegenOpen(true)}
              delayLongPress={380}
            >
              <View style={styles.proposalBox}>
                <Text selectable style={styles.proposalBody}>
                  {proposalText}
                </Text>
              </View>
            </Pressable>

            <View style={styles.metricsRow}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLbl}>Words</Text>
                <Text style={styles.metricValAccent}>{wordCount}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLbl}>Quality</Text>
                <Text style={styles.metricValPurple}>
                  {proposalScore != null ? `${proposalScore}/100` : "—"}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLbl}>Read ~</Text>
                <Text style={styles.metricValOk}>{readSeconds}s</Text>
              </View>
            </View>

            <Button
              title={copied ? "✓ Copied!" : "Copy Proposal"}
              variant="primary"
              onPress={copyProposal}
              style={{
                alignSelf: "stretch",
                backgroundColor: colors.success,
                borderColor: colors.success,
              }}
            />

            <Button title="Edit Proposal" variant="ghost" onPress={openEdit} />

            <Button
              title={markLoading ? "Marking…" : "Mark as Sent"}
              loading={markLoading}
              disabled={markLoading || !proposalId}
              onPress={markSent}
              accessibilityHint={
                offline
                  ? "Will sync with the server when you are back online"
                  : undefined
              }
            />
            {offlineMarkQueued ? (
              <Text style={styles.offlineQueued}>
                Queued — will mark as sent when you&apos;re back online.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Job picker sheet */}
      <Modal
        visible={jobPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setJobPickerOpen(false)}
      >
        <View style={styles.modalFlexEnd}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setJobPickerOpen(false)}
          />
          <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Recent jobs</Text>
          <FlatList
            data={jobList}
            keyExtractor={(j) => String(j._id)}
            style={{ maxHeight: 360 }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.border }} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => pickJob(String(item._id))}
                style={styles.pickerRow}
              >
                <Text style={styles.pickerTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.pickerMeta}>{item.budget}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.muted}>No saved jobs yet.</Text>
            }
          />
        </View>
        </View>
      </Modal>

      {/* Regenerate / actions sheet */}
      <Modal
        visible={regenOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRegenOpen(false)}
      >
        <View style={styles.modalFlexEnd}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setRegenOpen(false)}
          />
          <View style={[styles.regenSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Proposal actions</Text>
          <Pressable
            style={styles.regRow}
            onPress={() => {
              setRegenOpen(false);
              runGenerate(job);
            }}
          >
            <Ionicons name="refresh" size={18} color={colors.accent} />
            <Text style={styles.regText}>Regenerate</Text>
          </Pressable>
          <Pressable
            style={styles.regRow}
            onPress={() => {
              setRegenOpen(false);
            }}
          >
            <Ionicons name="layers-outline" size={18} color={colors.text} />
            <Text style={styles.regText}>Change mode</Text>
          </Pressable>
          <Pressable
            style={styles.regRow}
            onPress={() => {
              setRegenOpen(false);
            }}
          >
            <Ionicons name="pricetag-outline" size={18} color={colors.purple} />
            <Text style={styles.regText}>Change variant</Text>
          </Pressable>
          <Pressable
            style={styles.regRow}
            onPress={async () => {
              setRegenOpen(false);
              try {
                await Share.share({ message: proposalText });
              } catch {
                /* dismissed */
              }
            }}
          >
            <Ionicons name="share-outline" size={18} color={colors.text} />
            <Text style={styles.regText}>Share</Text>
          </Pressable>
          <Button
            title="Close"
            variant="ghost"
            onPress={() => setRegenOpen(false)}
          />
        </View>
        </View>
      </Modal>

      {/* Full-screen edit */}
      <Modal
        visible={editOpen}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
      >
        <KeyboardAvoidingView
          style={[styles.flex, { paddingTop: insets.top }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.editHeader}>
            <Pressable onPress={() => setEditOpen(false)}>
              <Text style={styles.editCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.editTitle}>Edit proposal</Text>
            <Pressable onPress={saveEditedContent}>
              <Text style={styles.editSave}>Save</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.editInput}
            multiline
            value={editDraft}
            onChangeText={setEditDraft}
            textAlignVertical="top"
            placeholderTextColor={colors.textDim}
          />
          <View style={[styles.editFooter, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <Text style={styles.charCount}>{editDraft.length} characters</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  muted: {
    marginTop: 10,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errTitle: {
    color: colors.danger,
    textAlign: "center",
    marginVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  bannerErr: {
    color: colors.danger,
    backgroundColor: `${colors.danger}18`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  jobCardMid: { flex: 1, minWidth: 0 },
  jobTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  jobBudget: {
    fontSize: 12,
    color: colors.success,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: fonts.medium,
  },
  pillRow: { gap: 8, paddingBottom: 14 },
  modePill: {
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
  modePillOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  pillText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  modePillTextOn: { color: colors.accentText, fontFamily: fonts.semiBold },
  varPill: {
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
  varPillOn: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleDim,
  },
  varPillText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.medium,
  },
  varPillTextOn: { color: colors.purple, fontFamily: fonts.semiBold },
  genBig: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  genBigDisabled: { opacity: 0.75 },
  offlineGenHint: {
    fontSize: 12,
    color: colors.warnText,
    fontFamily: fonts.regular,
    marginTop: -8,
    marginBottom: 12,
  },
  offlineQueued: {
    fontSize: 12,
    color: colors.warnText,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: 8,
  },
  genBigText: {
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  loadBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  loadHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  loadTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  stepDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  stepText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  resultBlock: { marginTop: 4 },
  resultHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  proposalBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surfaceHover,
    marginBottom: 14,
  },
  proposalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  metricLbl: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  metricValAccent: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  metricValPurple: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.purple,
  },
  metricValOk: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.success,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayMuted,
  },
  modalFlexEnd: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  regenSheet: {
    marginHorizontal: 16,
    marginBottom: 40,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  pickerRow: {
    paddingVertical: 12,
  },
  pickerTitle: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  pickerMeta: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  regRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  regText: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  editCancel: {
    fontSize: 16,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  editTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  editSave: {
    fontSize: 16,
    color: colors.accent,
    fontFamily: fonts.semiBold,
  },
  editInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontFamily: fonts.regular,
    backgroundColor: colors.bg,
  },
  editFooter: {
    padding: 12,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
});
