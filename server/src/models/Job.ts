import mongoose, { Schema } from "mongoose";

const clientInfoSchema = new Schema(
  {
    name: { type: String, required: true },
    country: { type: String, required: true },
    spent: { type: String },
    rating: { type: Number },
    hires: { type: Number },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: {
      type: String,
      enum: ["Upwork", "LinkedIn", "Wellfound", "Freelancer", "HackerNews", "Custom"],
      required: true,
    },
    title: { type: String, required: true },
    budget: { type: String, required: true },
    posted: { type: String, required: true },
    postedAt: { type: Date, default: Date.now },
    urgent: { type: Boolean, default: false },
    score: { type: Number, required: true, min: 0, max: 100 },
    client: { type: clientInfoSchema, required: true },
    tags: { type: [String], default: [] },
    snippet: { type: String, required: true },
    fullDescription: { type: String },
    reasons: { type: [String], default: [] },
    shouldApply: { type: Boolean },
    redFlags: { type: [String], default: [] },
    competition: { type: String, default: "" },
    timeline: { type: String, default: "" },
    url: { type: String },
    savedAt: { type: Date },
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

jobSchema.index({ userId: 1, platform: 1 });
jobSchema.index({ userId: 1, archived: 1, score: -1, postedAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
