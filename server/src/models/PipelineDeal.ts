import mongoose, { Schema } from "mongoose";

export const pipelineStages = [
  "applied",
  "replied",
  "discovery",
  "proposed",
  "negotiating",
  "won",
  "lost",
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

const activityLogSchema = new Schema(
  {
    action: { type: String, required: true },   // e.g. "moved to negotiating"
    fromStage: { type: String },
    toStage: { type: String },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const pipelineDealSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    client: { type: String, required: true },
    budget: { type: String, required: true },
    /** Parsed numeric value in USD — used for revenue aggregation */
    budgetValue: { type: Number, default: 0 },
    platform: { type: String, required: true },
    stage: {
      type: String,
      enum: pipelineStages,
      default: "applied",
    },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal" },
    notes: { type: String },
    nextAction: { type: String },
    activityLog: { type: [activityLogSchema], default: [] },
  },
  { timestamps: true }
);

pipelineDealSchema.index({ userId: 1, stage: 1 });
pipelineDealSchema.index({ userId: 1, updatedAt: -1 });

export const PipelineDeal = mongoose.model("PipelineDeal", pipelineDealSchema);
