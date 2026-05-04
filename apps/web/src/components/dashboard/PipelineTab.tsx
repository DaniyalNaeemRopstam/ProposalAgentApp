"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import type { PipelineDealRow, PipelineStageId } from "@/hooks/usePipeline";
import { PIPELINE_STAGE_ORDER, usePipeline } from "@/hooks/usePipeline";
import { apiUrl, authHeaders } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Column accents — MVP palette */
const COLUMN_ACCENT: Record<PipelineStageId, string> = {
  applied: "text-accent",
  replied: "text-teal",
  discovery: "text-purple",
  proposed: "text-accentText",
  negotiating: "text-warn",
  won: "text-success",
  lost: "text-textMuted",
};

const COLUMN_DOT: Record<PipelineStageId, string> = {
  applied: "bg-accent",
  replied: "bg-teal",
  discovery: "bg-purple",
  proposed: "bg-accentText",
  negotiating: "bg-warn",
  won: "bg-success",
  lost: "bg-textDim",
};

const STAGE_LABEL: Record<PipelineStageId, string> = {
  applied: "Applied",
  replied: "Replied",
  discovery: "Discovery",
  proposed: "Proposed",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

function dealKey(raw: PipelineDealRow): string {
  return String(raw._id);
}

async function apiErrorMessage(res: Response): Promise<string> {
  try {
    const json = await res.json();
    if (json && typeof json === "object" && "message" in json) {
      const msg = (json as { message: unknown }).message;
      return typeof msg === "string" ? msg : "Request failed";
    }
  } catch {
    //
  }
  return "Request failed";
}

function resolveDropStage(
  over: DragEndEvent["over"],
  grouped: Record<PipelineStageId, PipelineDealRow[]>,
): PipelineStageId | null {
  if (!over) return null;
  const oid = String(over.id);
  if (PIPELINE_STAGE_ORDER.includes(oid as PipelineStageId)) {
    return oid as PipelineStageId;
  }
  for (const s of PIPELINE_STAGE_ORDER) {
    if ((grouped[s] ?? []).some((d) => dealKey(d) === oid)) return s;
  }
  return null;
}

function DealCardBody({ deal, isOverlay }: { deal: PipelineDealRow; isOverlay?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface px-[18px] py-4 shadow-sm transition-shadow",
        !isOverlay && "cursor-grab hover:border-borderBright active:cursor-grabbing",
        isOverlay && "scale-[1.02] rotate-1 cursor-grabbing border-accent shadow-lg ring-2 ring-accent/25",
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PlatformBadge platform={deal.platform || "Other"} />
        <div className="font-display text-[15px] font-semibold leading-snug text-text">{deal.title}</div>
      </div>
      <div className="mb-2 text-[13px] font-medium text-success">{deal.budget}</div>
      <div className="mb-2 text-[12px] text-textMuted">{deal.client}</div>
      {deal.nextAction ? (
        <div className="flex items-start gap-1.5 text-[11px] leading-relaxed text-textDim">
          <span className="mt-0.5 shrink-0 text-accentText">
            <Icon name="zap" size={11} />
          </span>
          <span>{deal.nextAction}</span>
        </div>
      ) : null}
    </div>
  );
}

function DraggableDealCard({
  deal,
  dragDisabled,
}: {
  deal: PipelineDealRow;
  dragDisabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dealKey(deal),
    data: { deal, type: "deal" as const },
    disabled: dragDisabled,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <DealCardBody deal={deal} />
    </div>
  );
}

function PipelineColumn({
  stage,
  deals,
  dragDisabled,
}: {
  stage: PipelineStageId;
  deals: PipelineDealRow[];
  dragDisabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage, type: "column" as const },
  });

  return (
    <div className="flex w-[268px] shrink-0 flex-col rounded-xl border border-border bg-[#0f1116]">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", COLUMN_DOT[stage])} />
          <div
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.06em]",
              COLUMN_ACCENT[stage],
            )}
          >
            {STAGE_LABEL[stage]}
          </div>
          <span className="ml-auto text-[11px] font-medium text-textDim">{deals.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto p-3 pb-4",
          isOver && "bg-accent/[0.04]",
        )}
      >
        {deals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-center text-[11px] text-textDim">
            Drop deals here
          </div>
        ) : (
          deals.map((d) => <DraggableDealCard key={dealKey(d)} deal={d} dragDisabled={dragDisabled} />)
        )}
      </div>
    </div>
  );
}

type CreateForm = {
  title: string;
  client: string;
  budget: string;
  platform: string;
  stage: PipelineStageId;
  notes: string;
  nextAction: string;
};

const emptyForm = (): CreateForm => ({
  title: "",
  client: "",
  budget: "",
  platform: "Upwork",
  stage: "applied",
  notes: "",
  nextAction: "",
});

export function PipelineTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = usePipeline();
  const [activeDeal, setActiveDeal] = useState<PipelineDealRow | null>(null);
  const [moveErr, setMoveErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [formErr, setFormErr] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: PipelineStageId }) => {
      const res = await fetch(apiUrl(`/api/pipeline/${id}/stage`), {
        method: "PUT",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error(await apiErrorMessage(res));
      return res.json();
    },
    onMutate: async ({ id, stage }) => {
      setMoveErr(null);
      await queryClient.cancelQueries({ queryKey: ["pipeline"] });
      const previous = queryClient.getQueryData<{
        grouped: Record<PipelineStageId, PipelineDealRow[]>;
        totalValue: number;
      }>(["pipeline"]);

      if (previous) {
        let moved: PipelineDealRow | undefined;
        const nextGrouped = { ...previous.grouped };
        for (const s of PIPELINE_STAGE_ORDER) {
          nextGrouped[s] = (nextGrouped[s] ?? []).filter((d) => {
            if (dealKey(d) === id) {
              moved = { ...d, stage };
              return false;
            }
            return true;
          });
        }
        if (moved) {
          nextGrouped[stage] = [moved, ...(nextGrouped[stage] ?? [])];
        }
        queryClient.setQueryData(["pipeline"], {
          grouped: nextGrouped,
          totalValue: previous.totalValue,
        });
      }

      return { previous };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["pipeline"], ctx.previous);
      }
      setMoveErr(err.message ?? "Could not update stage");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: CreateForm) => {
      const res = await fetch(apiUrl("/api/pipeline"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: body.title.trim(),
          client: body.client.trim(),
          budget: body.budget.trim(),
          platform: body.platform.trim(),
          stage: body.stage,
          notes: body.notes.trim() || undefined,
          nextAction: body.nextAction.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await apiErrorMessage(res));
      return res.json();
    },
    onSuccess: () => {
      setModalOpen(false);
      setForm(emptyForm());
      setFormErr(null);
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (e: Error) => {
      setFormErr(e.message ?? "Could not create deal");
    },
  });

  const handleDragStart = ({ active }: DragStartEvent) => {
    const dragData = active.data.current as { deal?: PipelineDealRow } | undefined;
    setActiveDeal(dragData?.deal ?? null);
    setMoveErr(null);
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = ev;

    const cached = queryClient.getQueryData<{
      grouped: Record<PipelineStageId, PipelineDealRow[]>;
      totalValue: number;
    }>(["pipeline"]);
    const grouped = cached?.grouped;
    if (!grouped) return;

    const idStr = String(active.id);
    let source: PipelineDealRow | undefined = (active.data.current as { deal?: PipelineDealRow } | undefined)?.deal;
    if (!source?.stage) {
      for (const s of PIPELINE_STAGE_ORDER) {
        const found = (grouped[s] ?? []).find((d) => dealKey(d) === idStr);
        if (found) {
          source = found;
          break;
        }
      }
    }
    if (!source) return;

    const targetStage = resolveDropStage(over, grouped);
    if (!targetStage || source.stage === targetStage) return;

    moveMutation.mutate({ id: dealKey(source), stage: targetStage });
  };

  const grouped = data?.grouped;
  const totalValue = data?.totalValue ?? 0;
  const fmtd =
    totalValue <= 0
      ? "$0"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(totalValue);

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-dangerDim/30 p-10 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
          <Icon name="target" size={22} />
        </div>
        <p className="text-sm text-danger">Failed to load pipeline. Please try again.</p>
      </div>
    );
  }

  if (isLoading || !grouped) {
    return (
      <div className="animate-slideUp">
        <div className="mb-5 flex animate-pulse items-center gap-6">
          <div className="h-10 w-[42%] max-w-xl rounded-lg bg-border" />
          <div className="ml-auto h-9 w-28 rounded-full bg-border" />
        </div>
        <div className="-mx-1 flex gap-3 overflow-hidden pb-2">
          {PIPELINE_STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className="flex w-[268px] shrink-0 flex-col rounded-xl border border-border bg-[#0f1116]"
            >
              <div className="h-11 border-b border-border px-4" />
              <div className="space-y-3 p-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-[120px] rounded-xl border border-border bg-surface" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const dragDisabled = moveMutation.isPending;

  const submitDeal = () => {
    setFormErr(null);
    if (!form.title.trim() || !form.client.trim() || !form.budget.trim() || !form.platform.trim()) {
      setFormErr("Fill in title, client, budget, and platform.");
      return;
    }
    createMutation.mutate(form);
  };

  const closeModal = () => {
    if (createMutation.isPending) return;
    setModalOpen(false);
    setForm(emptyForm());
    setFormErr(null);
  };

  return (
    <>
      <div className="animate-slideUp">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-2xl text-[13px] leading-relaxed text-textMuted">
            Track deals from <span className="text-accent">applied</span> to{" "}
            <span className="text-success">won</span> — drag cards between stages. Pipeline value{" "}
            <span className="font-display font-semibold text-teal">{fmtd}</span>
          </p>
          <Btn
            variant="primary"
            type="button"
            className="shrink-0 text-xs"
            leftIcon={<Icon name="trending" size={13} />}
            onClick={() => setModalOpen(true)}
          >
            + Add deal
          </Btn>
        </div>

        {moveErr ? (
          <div className="mb-4 rounded-lg border border-danger/30 bg-dangerDim/40 px-3 py-2 text-[12px] text-danger">
            {moveErr}
          </div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-3 pt-0.5">
            {PIPELINE_STAGE_ORDER.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                deals={grouped[stage] ?? []}
                dragDisabled={dragDisabled}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
            {activeDeal ? <DealCardBody deal={activeDeal} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" aria-hidden />
          <div
            className="relative z-[1] w-full max-w-md animate-slideUp rounded-xl border border-border bg-surface p-6 shadow-2xl"
            role="dialog"
            aria-modal
            aria-labelledby="add-deal-title"
          >
            <div id="add-deal-title" className="mb-6 font-display text-lg font-semibold text-text">
              New deal
            </div>

            {formErr ? (
              <div className="mb-4 rounded-lg border border-danger/30 bg-dangerDim/35 px-3 py-2 text-[12px] text-danger">
                {formErr}
              </div>
            ) : null}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Title
                </span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
                  placeholder="e.g. SaaS MVP build"
                  disabled={createMutation.isPending}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Client
                </span>
                <input
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                  placeholder="Company or contact"
                  disabled={createMutation.isPending}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Budget
                </span>
                <input
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                  placeholder="$8,000 – $15,000"
                  disabled={createMutation.isPending}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Platform
                </span>
                <select
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                  disabled={createMutation.isPending}
                >
                  {["Upwork", "LinkedIn", "Wellfound", "Other"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Stage
                </span>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as PipelineStageId }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                  disabled={createMutation.isPending}
                >
                  {PIPELINE_STAGE_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Next action
                </span>
                <input
                  value={form.nextAction}
                  onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                  placeholder="Optional"
                  disabled={createMutation.isPending}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-textMuted">
                  Notes
                </span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                  placeholder="Optional"
                  disabled={createMutation.isPending}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Btn variant="ghost" type="button" className="text-xs" onClick={closeModal}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                type="button"
                className="text-xs"
                disabled={createMutation.isPending}
                onClick={submitDeal}
              >
                {createMutation.isPending ? "Saving…" : "Create deal"}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
