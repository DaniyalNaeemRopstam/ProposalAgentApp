import { sendEmail } from "../utils/emailService";
import {
  dayThreeNoProposal,
  firstProposalGenerated,
  freeLimitReached,
  secondProposalFreeReminder,
  welcomeOnRegister,
} from "../utils/emailTemplates";

type LeanUserBrief = {
  email?: string;
  name?: string;
  plan?: string;
};

/**
 * Runs after POST /register — never throws.
 */
export function scheduleWelcomeEmailAfterRegister(email: string, name: string): void {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !name?.trim()) return;

  void (async () => {
    const { subject, html } = welcomeOnRegister({ name: name.trim() });
    await sendEmail({ to: trimmed, subject, html });
  })().catch(() => undefined);
}

/**
 * Free-plan milestone onboarding after AI proposal persists.
 * Uses post-increment tallies from Mongoose `{ new:true }`.
 */
export function scheduleOnboardingEmailsAfterProposal(user: LeanUserBrief, totalAfterThisOne: number): void {
  if (!user.plan || user.plan !== "free") return;
  const email = user.email?.trim().toLowerCase();
  const name = user.name?.trim();
  if (!email || !name) return;

  void (async () => {
    if (totalAfterThisOne === 1) {
      const { subject, html } = firstProposalGenerated({ name });
      await sendEmail({ to: email, subject, html });
      return;
    }
    if (totalAfterThisOne === 2) {
      const { subject, html } = secondProposalFreeReminder({ name });
      await sendEmail({ to: email, subject, html });
      return;
    }
    if (totalAfterThisOne === 3) {
      const { subject, html } = freeLimitReached({ name });
      await sendEmail({ to: email, subject, html });
    }
  })().catch(() => undefined);
}

export async function sendDayThreeReengagementNow(email: string, name: string): Promise<boolean> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !name?.trim()) return false;
  const { subject, html } = dayThreeNoProposal({ name: name.trim() });
  return sendEmail({ to: trimmed, subject, html });
}
