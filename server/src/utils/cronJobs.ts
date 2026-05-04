import { Proposal } from "../models/Proposal";
import { Sequence } from "../models/Sequence";

const SIX_HOURS = 6 * 60 * 60 * 1_000;

// ─── Auto-stop sequences whose proposal got a reply or win ───────────────────

async function syncStoppedSequences(): Promise<void> {
  // Find proposals that are replied/won and have active sequences
  const repliedOrWon = await Proposal.find({
    status: { $in: ["replied", "won"] },
  })
    .select("_id")
    .lean();

  if (!repliedOrWon.length) return;

  const proposalIds = repliedOrWon.map((p) => p._id);

  const result = await Sequence.updateMany(
    { proposalId: { $in: proposalIds }, status: "active" },
    {
      $set: {
        status: "replied",
        "messages.$[pending].status": "skipped",
      },
    },
    {
      arrayFilters: [{ "pending.status": "pending" }],
    }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `[cron] auto-stopped ${result.modifiedCount} sequence(s) — proposal replied/won`
    );
  }
}

// ─── Mark due messages as sent (Phase 1: DB-only) ────────────────────────────
// In Phase 2, replace the Sequence.updateOne call body with real email/LinkedIn sending.

async function processDueMessages(): Promise<void> {
  const now = new Date();

  const sequences = await Sequence.find({
    status: "active",
    "messages.status": "pending",
    "messages.scheduledAt": { $lte: now },
  });

  let sent = 0;
  let allComplete = 0;

  for (const seq of sequences) {
    // Work through pending+due messages in day order
    const dueMsgs = seq.messages
      .filter((m) => m.status === "pending" && m.scheduledAt <= now)
      .sort((a, b) => a.day - b.day);

    for (const msg of dueMsgs) {
      // --- Phase 2 hook: await emailService.send(msg) / linkedInService.send(msg) ---
      msg.status = "sent";
      msg.sentAt = new Date();
      sent++;
    }

    // If no pending messages remain, mark sequence complete
    const stillPending = seq.messages.some((m) => m.status === "pending");
    if (!stillPending) {
      seq.status = "stopped";
      allComplete++;
    }

    await seq.save();
  }

  if (sent > 0 || allComplete > 0) {
    console.log(
      `[cron] processed ${sent} due follow-up message(s); ${allComplete} sequence(s) completed`
    );
  }
}

// ─── Single cron tick ─────────────────────────────────────────────────────────

async function cronTick(): Promise<void> {
  try {
    await syncStoppedSequences();
    await processDueMessages();
  } catch (err) {
    console.error("[cron] error during tick:", err);
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

let timer: ReturnType<typeof setInterval> | null = null;

/** Start the cron loop. Call once after MongoDB connects. */
export function startCronJobs(): void {
  if (timer) return; // idempotent

  // Run immediately on boot, then every 6 hours
  void cronTick();
  timer = setInterval(() => void cronTick(), SIX_HOURS);

  // Allow the process to exit cleanly even if interval is pending
  timer.unref?.();

  console.log("[cron] follow-up sequence scheduler started (6h interval)");
}

/** Stop the cron loop (useful in tests). */
export function stopCronJobs(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** Exposed for manual trigger / integration tests. */
export { cronTick };
