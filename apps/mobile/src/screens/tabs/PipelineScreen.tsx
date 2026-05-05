import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import LottieView from "lottie-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { serverApi } from "../../lib/api";
import {
  type PipelineDealRow,
  type PipelineStageId,
  PIPELINE_STAGE_ORDER,
  nextStageFor,
  usePipeline,
} from "../../hooks/usePipeline";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const STAGE_LABEL: Record<PipelineStageId, string> = {
  applied: "Applied",
  replied: "Replied",
  discovery: "Discovery",
  proposed: "Proposed",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

const STAGE_COLOR: Record<PipelineStageId, string> = {
  applied: colors.accent,
  replied: colors.teal,
  discovery: colors.purple,
  proposed: colors.accentText,
  negotiating: colors.warn,
  won: colors.success,
  lost: colors.textDim,
};

function parseBudgetMid(budget: string): number {
  const nums = budget
    .replace(/[^0-9.,-]/g, "")
    .split(/[-,]/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (!nums.length) return 0;
  return nums.length === 1 ? nums[0] : (nums[0] + nums[nums.length - 1]) / 2;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PipelineScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isRefetching } = usePipeline();

  const [addOpen, setAddOpen] = useState(false);
  const [detailDeal, setDetailDeal] = useState<PipelineDealRow | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formPlatform, setFormPlatform] = useState("Upwork");
  const [formStage, setFormStage] = useState<PipelineStageId>("applied");

  const moveStage = useMutation({
    mutationFn: async (args: {
      id: string;
      stage: PipelineStageId;
      revenueAmount?: number;
    }) => {
      const body: Record<string, unknown> = { stage: args.stage };
      if (args.revenueAmount != null) body.revenueAmount = args.revenueAmount;
      try {
        return await serverApi.request<unknown>(
          `/api/pipeline/${args.id}/stage`,
          { method: "PUT", body }
        );
      } catch (e) {
        const err = e as { message?: string };
        throw new Error(
          typeof err.message === "string" ? err.message : "Move failed"
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const createDeal = useMutation({
    mutationFn: async () => {
      try {
        await serverApi.request<unknown>("/api/pipeline", {
          method: "POST",
          body: {
            title: formTitle.trim(),
            client: formClient.trim(),
            budget: formBudget.trim(),
            platform: formPlatform.trim(),
            stage: formStage,
          },
        });
      } catch (e) {
        const err = e as { message?: string };
        throw new Error(
          typeof err.message === "string" ? err.message : "Create failed"
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      setAddOpen(false);
      setFormTitle("");
      setFormClient("");
      setFormBudget("");
      setFormPlatform("Upwork");
      setFormStage("applied");
    },
  });

  const updateDealStage = useMutation({
    mutationFn: async (args: { id: string; stage: PipelineStageId }) => {
      try {
        await serverApi.request<unknown>(
          `/api/pipeline/${args.id}/stage`,
          { method: "PUT", body: { stage: args.stage } }
        );
      } catch (e) {
        const err = e as { message?: string };
        throw new Error(
          typeof err.message === "string" ? err.message : "Update failed"
        );
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }),
  });

  const sections = useMemo(() => {
    if (!data) return [];
    return PIPELINE_STAGE_ORDER.map((stage) => ({
      stage,
      title: STAGE_LABEL[stage],
      color: STAGE_COLOR[stage],
      data: data.grouped[stage] ?? [],
    })).filter((s) => s.data.length > 0);
  }, [data]);

  const dealCount = data?.grouped
    ? Object.values(data.grouped).reduce((a, b) => a + b.length, 0)
    : 0;

  const totalVal = data?.totalValue ?? 0;

  const advance = useCallback(
    (deal: PipelineDealRow) => {
      const next = nextStageFor(deal.stage);
      if (!next) return;

      const run = (revenue?: number) => {
        moveStage.mutate(
          { id: deal._id, stage: next, revenueAmount: revenue },
          {
            onSuccess: () => {
              if (next === "won") {
                setShowConfetti(true);
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
            },
          }
        );
      };

      if (next === "won") {
        const suggested = parseBudgetMid(deal.budget);
        Alert.alert(
          "Mark as won?",
          "This updates your revenue stats.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              onPress: () => run(suggested > 0 ? suggested : undefined),
            },
          ]
        );
        return;
      }

      run();
    },
    [moveStage]
  );

  const renderAdvance = useCallback(
    () => (
      <View style={styles.swipeAdv}>
        <Ionicons name="arrow-forward" size={18} color={colors.success} />
        <Text style={styles.swipeAdvTxt}>Next</Text>
      </View>
    ),
    []
  );

  const renderDeal = useCallback(
    ({ item }: { item: PipelineDealRow }) => {
      const hasNext = nextStageFor(item.stage) !== null;
      return (
        <Swipeable
          friction={2}
          enabled={hasNext}
          renderLeftActions={hasNext ? renderAdvance : undefined}
          onSwipeableWillOpen={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onSwipeableOpen={(dir, methods) => {
            if (dir === "left" && hasNext) {
              advance(item);
            }
            methods.close();
          }}
        >
          <Pressable
            onPress={() => setDetailDeal(item)}
            style={({ pressed }) => [
              styles.dealCard,
              pressed && { opacity: 0.96 },
            ]}
          >
            <Text style={styles.dealTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.dealClient} numberOfLines={1}>
              {item.client}
            </Text>
            <Text style={styles.dealBudget}>{item.budget}</Text>
            {item.nextAction ? (
              <View style={styles.nextRow}>
                <Ionicons name="flash-outline" size={12} color={colors.accentText} />
                <Text style={styles.nextTxt} numberOfLines={2}>
                  {item.nextAction}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </Swipeable>
      );
    },
    [advance, renderAdvance]
  );

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.err}>
          {error instanceof Error ? error.message : "Error"}
        </Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 72 }]}>
      <View style={[styles.summary, { marginTop: 8 }]}>
        <Text style={styles.summaryTxt}>
          {dealCount} deal{dealCount === 1 ? "" : "s"} ·{" "}
          {formatMoney(totalVal)} pipeline value
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(d) => String(d._id)}
        renderItem={renderDeal}
        SectionSeparatorComponent={() => <View style={{ height: 12 }} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHead}>
            <View
              style={[styles.sectionDot, { backgroundColor: section.color }]}
            />
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {section.title.toUpperCase()}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>No deals yet. Add one with +</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.accent}
          />
        }
      />

      <Pressable
        style={[
          styles.fab,
          { bottom: insets.bottom + 16, right: 16 },
        ]}
        onPress={() => setAddOpen(true)}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </Pressable>

      {showConfetti ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.confettiLayer]}
        >
          <LottieView
            source={require("../../../assets/confetti.json")}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowConfetti(false)}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : null}

      <Modal visible={addOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setAddOpen(false)} />
          <View style={[styles.addSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTit}>New deal</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.textDim}
              style={styles.inp}
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <TextInput
              placeholder="Client"
              placeholderTextColor={colors.textDim}
              style={styles.inp}
              value={formClient}
              onChangeText={setFormClient}
            />
            <TextInput
              placeholder="Budget (e.g. $8,000–$15,000)"
              placeholderTextColor={colors.textDim}
              style={styles.inp}
              value={formBudget}
              onChangeText={setFormBudget}
            />
            <TextInput
              placeholder="Platform"
              placeholderTextColor={colors.textDim}
              style={styles.inp}
              value={formPlatform}
              onChangeText={setFormPlatform}
            />
            <Text style={styles.formLbl}>Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stagePick}>
              {PIPELINE_STAGE_ORDER.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setFormStage(s)}
                  style={[
                    styles.stageChip,
                    formStage === s && {
                      borderColor: STAGE_COLOR[s],
                      backgroundColor: colors.surfaceHover,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stageChipTxt,
                      formStage === s && { color: STAGE_COLOR[s] },
                    ]}
                  >
                    {STAGE_LABEL[s]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              title={createDeal.isPending ? "Saving…" : "Save deal"}
              loading={createDeal.isPending}
              disabled={
                createDeal.isPending ||
                !formTitle.trim() ||
                !formClient.trim() ||
                !formBudget.trim()
              }
              onPress={() => createDeal.mutate()}
            />
            <Button title="Cancel" variant="ghost" onPress={() => setAddOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!detailDeal} transparent animationType="fade">
        <View style={styles.detailRoot}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setDetailDeal(null)}
          />
          <View style={styles.detailCard}>
            {detailDeal ? (
              <>
                <Text style={styles.detailTitle}>{detailDeal.title}</Text>
                <Text style={styles.detailMeta}>{detailDeal.client}</Text>
                <Text style={styles.detailBudget}>{detailDeal.budget}</Text>
                <Text style={styles.detailPlatform}>{detailDeal.platform}</Text>
                {detailDeal.notes ? (
                  <Text style={styles.detailNotes}>{detailDeal.notes}</Text>
                ) : null}
                <Text style={styles.formLbl}>Stage</Text>
                {PIPELINE_STAGE_ORDER.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => {
                      if (!detailDeal || detailDeal.stage === s) return;
                      const d = detailDeal._id;
                      if (s === "won") {
                        const sug = parseBudgetMid(detailDeal.budget);
                        Alert.alert(
                          "Mark deal as won?",
                          undefined,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Won",
                              onPress: () => {
                                moveStage.mutate(
                                  { id: d, stage: "won", revenueAmount: sug || undefined },
                                  {
                                    onSuccess: () => {
                                      setDetailDeal(null);
                                      setShowConfetti(true);
                                      void Haptics.notificationAsync(
                                        Haptics.NotificationFeedbackType.Success
                                      );
                                    },
                                  }
                                );
                              },
                            },
                          ]
                        );
                        return;
                      }
                      updateDealStage.mutate(
                        { id: d, stage: s },
                        { onSuccess: () => setDetailDeal(null) }
                      );
                    }}
                    style={[
                      styles.stageRow,
                      detailDeal.stage === s && styles.stageRowOn,
                    ]}
                  >
                    <Text style={styles.stageRowTxt}>{STAGE_LABEL[s]}</Text>
                    {detailDeal.stage === s ? (
                      <Ionicons name="checkmark" size={18} color={colors.success} />
                    ) : null}
                  </Pressable>
                ))}
                <Button title="Close" variant="ghost" onPress={() => setDetailDeal(null)} />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: colors.danger, marginBottom: 12 },
  summary: { paddingHorizontal: 16, paddingBottom: 8 },
  summaryTxt: { fontSize: 14, color: colors.textMuted, fontFamily: fonts.medium },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 11, fontFamily: fonts.semiBold, letterSpacing: 0.8, flex: 1 },
  sectionCount: { fontSize: 11, color: colors.textDim, fontFamily: fonts.medium },
  dealCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  dealTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
  dealClient: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  dealBudget: { fontSize: 13, fontFamily: fonts.medium, color: colors.success, marginTop: 6 },
  nextRow: { flexDirection: "row", gap: 6, marginTop: 8, alignItems: "flex-start" },
  nextTxt: { flex: 1, fontSize: 11, color: colors.textDim, lineHeight: 16 },
  swipeAdv: {
    width: 80,
    backgroundColor: colors.successDim,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 8,
    gap: 4,
  },
  swipeAdvTxt: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.success },
  fab: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confettiLayer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 100,
  },
  empty: { padding: 40, alignItems: "center" },
  emptyTxt: { color: colors.textMuted, fontFamily: fonts.regular },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayMuted,
  },
  addSheet: {
    backgroundColor: colors.surface,
    padding: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  sheetTit: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  inp: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    color: colors.text,
    backgroundColor: colors.bg,
    fontFamily: fonts.regular,
  },
  formLbl: {
    fontSize: 11,
    color: colors.textDim,
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  stagePick: { maxHeight: 44 },
  stageChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  stageChipTxt: { fontSize: 12, color: colors.textMuted },
  detailRoot: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "85%",
  },
  detailTitle: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.text },
  detailMeta: { fontSize: 14, color: colors.textMuted, marginTop: 6 },
  detailBudget: { fontSize: 15, color: colors.success, marginTop: 8 },
  detailPlatform: { fontSize: 13, color: colors.accentText, marginTop: 4 },
  detailNotes: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stageRowOn: { backgroundColor: colors.successDim },
  stageRowTxt: { fontSize: 15, color: colors.text, fontFamily: fonts.regular },
});
