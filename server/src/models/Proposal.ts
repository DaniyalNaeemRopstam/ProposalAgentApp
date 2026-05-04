import mongoose, { Schema } from "mongoose";

const jobSnapshotSchema = new Schema(
  {
    platform: { type: String },
    title: { type: String },
    budget: { type: String },
    snippet: { type: String },
    tags: { type: [String] },
    client: { type: Schema.Types.Mixed },
  },
  { _id: false, strict: false }
);

const proposalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    job: { type: jobSnapshotSchema, default: {} },
    mode: { type: String, enum: ["upwork", "linkedin", "email"], required: true },
    variant: { type: String, enum: ["quality", "price", "speed"], required: true },
    content: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    replyProbability: { type: Number, default: 0 },
    proposalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "replied", "shortlisted", "won", "lost"],
      default: "draft",
    },
    sentAt: { type: Date },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

proposalSchema.index({ userId: 1, createdAt: -1 });

export const Proposal = mongoose.model("Proposal", proposalSchema);
