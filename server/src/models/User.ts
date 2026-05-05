import mongoose, { Schema } from "mongoose";

const userStatsSchema = new Schema(
  {
    proposalsSent: { type: Number, default: 0 },
    repliesReceived: { type: Number, default: 0 },
    projectsWon: { type: Number, default: 0 },
    revenueWon: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    replyRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const projectReferenceSchema = new Schema(
  {
    title: { type: String, required: true },
    client: { type: String, required: true },
    outcome: { type: String, required: true },
    stack: { type: [String], default: [] },
    budget: { type: String, required: true },
  },
  { timestamps: false }
);

const insightsCacheSchema = new Schema(
  {
    insights: { type: Schema.Types.Mixed, default: [] },
    cachedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    companyName: { type: String, required: true, trim: true },
    avatar: { type: String },
    plan: {
      type: String,
      enum: ["free", "solo", "pro", "enterprise"],
      default: "free",
    },
    stripeCustomerId: { type: String },
    voiceProfile: { type: String },
    projectLibrary: { type: [projectReferenceSchema], default: [] },
    stats: { type: userStatsSchema, default: () => ({}) },
    insightsCache: { type: insightsCacheSchema, default: null },
    /** Expo push token (ExponentPushToken[…]) — mobile only */
    pushToken: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const plain = ret as { passwordHash?: string };
    delete plain.passwordHash;
    return plain;
  },
});

export const User = mongoose.model("User", userSchema);
