import nodemailer from "nodemailer";

export type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.FROM_EMAIL?.trim());
}

/**
 * Sends an HTML email. Never throws — logs and returns whether send was attempted successfully.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<boolean> {
  if (!smtpConfigured()) {
    console.warn("[email] SMTP_HOST / FROM_EMAIL not set — skipping send:", opts.subject);
    return false;
  }

  try {
    const host = process.env.SMTP_HOST!.trim();
    const port = Number(process.env.SMTP_PORT?.trim() || "587");
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass ?? "" } : undefined,
    });

    const fromEmail = process.env.FROM_EMAIL!.trim();
    const fromName = (process.env.FROM_NAME ?? "ProposalAgent").trim();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
