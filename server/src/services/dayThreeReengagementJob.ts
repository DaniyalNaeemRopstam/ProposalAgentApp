import { User } from "../models/User";
import { sendDayThreeReengagementNow } from "./onboardingEmailTriggers";

/** Start of calendar day in UTC containing `date`. */
function utcDayStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Sends Template 5 to free users registered exactly three calendar days ago (UTC),
 * who have never generated an AI proposal, and haven't received this email yet.
 */
export async function runDayThreeReengagementBatch(): Promise<{ scanned: number; sent: number }> {
  const now = new Date();
  const anchor = new Date(now);
  anchor.setUTCDate(anchor.getUTCDate() - 3);
  const dayStart = utcDayStart(anchor);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const users = await User.find({
    plan: "free",
    $or: [
      { totalProposalsGenerated: { $exists: false } },
      { totalProposalsGenerated: { $eq: 0 } },
    ],
    createdAt: { $gte: dayStart, $lt: dayEnd },
    reengagementEmailSentAt: { $exists: false },
  })
    .select("_id email name")
    .limit(750)
    .lean();

  let sent = 0;
  for (const u of users) {
    const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";
    const name = typeof u.name === "string" ? u.name.trim() : "";
    if (!email || !name) continue;
    try {
      const ok = await sendDayThreeReengagementNow(email, name);
      if (ok && u._id) {
        await User.updateOne(
          { _id: u._id },
          { $set: { reengagementEmailSentAt: new Date() } }
        );
        sent += 1;
      }
    } catch {
      console.error("[onboarding-email] day-3 job row failed:", u._id);
    }
  }

  return { scanned: users.length, sent };
}
