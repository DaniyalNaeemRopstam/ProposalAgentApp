"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { Btn } from "@/components/ui/Btn";
import { useAuth } from "@/context/AuthContext";
import { C } from "@/styles/theme";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  companyName: z.string().min(1, "Company name is required").max(200),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupPromptModalProps = {
  open: boolean;
  onClose: () => void;
  /** Called after successful registration (modal still open — parent may close + run follow-up). */
  onRegistered: () => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surfaceHover px-3 py-2.5 text-sm text-text outline-none placeholder:text-textDim focus:border-accent";

function Field({
  label,
  error,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="mb-3 block text-left">
      <span className="text-[11px] font-medium uppercase tracking-wide text-textMuted">{label}</span>
      <input className={inputClass} {...inputProps} />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </label>
  );
}

export function SignupPromptModal({ open, onClose, onRegistered }: SignupPromptModalProps) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof z.infer<typeof schema>, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = schema.safeParse({ name, email, companyName, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: f.name?.[0],
        email: f.email?.[0],
        companyName: f.companyName?.[0],
        password: f.password?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        companyName: parsed.data.companyName,
        password: parsed.data.password,
      });
      onRegistered();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex items-stretch justify-center overflow-y-auto bg-black/70 px-3 py-8 backdrop-blur-md sm:px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="my-auto flex min-h-[min(640px,92vh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl sm:flex-row"
        style={{
          borderColor: C.borderBright,
          background: "#0E1119",
          boxShadow: `0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px ${C.accent}40`,
        }}
        role="dialog"
        aria-modal
        aria-labelledby="signup-prompt-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-1 flex-col justify-center overflow-hidden border-b border-border p-8 sm:max-w-[46%] sm:border-b-0 sm:border-r">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              background: `radial-gradient(800px 400px at 20% 10%, ${C.accent}, transparent 60%)`,
            }}
          />
          <h2 id="signup-prompt-title" className="relative font-display text-xl font-bold text-text">
            You&apos;re one step away
          </h2>
          <p className="relative mt-2 text-sm leading-relaxed text-textMuted">
            Create your free account to generate AI proposals
          </p>
          <ul className="relative mt-6 space-y-2.5 text-sm text-text">
            {[
              "3 free AI proposals — no credit card",
              "Proposals written in YOUR voice",
              "Smart job matching from 4 platforms",
              "Automatic follow-up sequences",
              "Win rate analytics",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-accent">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="relative mt-8 text-xs text-textDim">
            Free forever. Upgrade only when you need more.
          </p>
        </div>

        <div className="relative flex flex-1 flex-col justify-center p-8">
          <form onSubmit={onSubmit} className="w-full max-w-md self-center">
            <h3 className="sr-only">Create account</h3>
            {formError ? (
              <div
                className="mb-4 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: `${C.danger}55`,
                  background: `${C.danger}14`,
                  color: C.danger,
                }}
              >
                {formError}
              </div>
            ) : null}
            <Field
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              autoComplete="name"
              disabled={submitting}
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoComplete="email"
              disabled={submitting}
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
              disabled={submitting}
            />
            <Field
              label="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={fieldErrors.companyName}
              autoComplete="organization"
              disabled={submitting}
            />

            <Btn type="submit" variant="primary" className="mt-2 w-full justify-center py-3" disabled={submitting}>
              {submitting ? "Creating…" : "Create free account"}
            </Btn>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-textDim">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href="/login"
              className="block text-center text-sm text-accent hover:underline"
              onClick={onClose}
            >
              Log in instead
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
