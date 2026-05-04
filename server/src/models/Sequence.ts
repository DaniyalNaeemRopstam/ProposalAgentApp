import mongoose, { Schema } from "mongoose";

const followUpMessageSchema = new Schema(
  {
    day: { type: Number, enum: [3, 7, 14], required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "skipped"],
      default: "pending",
    },
    scheduledAt: { type: Date, required: true },
    sentAt: { type: Date },
  },
  { _id: true }
);

const sequenceSchema = new Schema(
  {
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobTitle: { type: String, required: true },
    platform: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "replied", "stopped"],
      default: "active",
    },
    viewed: { type: Boolean, default: false },
    messages: { type: [followUpMessageSchema], default: [] },
  },
  { timestamps: true }
);

sequenceSchema.index({ userId: 1, status: 1 });

export const Sequence = mongoose.model("Sequence", sequenceSchema);
