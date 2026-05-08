"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { C } from "@/styles/theme";

const schema = z
  .object({
    name: z.string().min(1, "Name is required").max(120),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(200),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Strength = "weak" | "medium" | "strong";

function passwordStrength(pw: string): Strength {
  if (pw.length < 8) return "weak";
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^a-zA-Z0-9]/.test(pw);
  const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;
  if (pw.length >= 12 && variety >= 3) return "strong";
  if (pw.length >= 8 && variety >= 2) return "medium";
  return "weak";
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authBoot } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof z.infer<typeof schema>, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  if (authBoot) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <LoadingSpinner />
        <p className="text-sm text-textMuted">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    router.replace("/dashboard/jobs");
    return null;
  }

  const strengthBar =
    strength === "weak"
      ? { w: "33%", bg: C.danger, label: "Weak" }
      : strength === "medium"
        ? { w: "66%", bg: C.warn, label: "Medium" }
        : { w: "100%", bg: C.success, label: "Strong" };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = schema.safeParse({
      name,
      email,
      companyName,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: f.name?.[0],
        email: f.email?.[0],
        companyName: f.companyName?.[0],
        password: f.password?.[0],
        confirmPassword: f.confirmPassword?.[0],
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
      router.replace("/onboarding");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Create account
        </h1>
        <p className="mt-2 text-sm text-textMuted">
          Start winning more clients with AI proposals
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border bg-surface p-4 sm:p-6"
      >
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
          label="Full name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          autoComplete="name"
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          autoComplete="email"
        />
        <Field
          label="Company name"
          value={companyName}
          onChange={setCompanyName}
          error={fieldErrors.companyName}
          autoComplete="organization"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        {password.length > 0 ? (
          <div className="mt-2">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-surfaceHover">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: strengthBar.w, background: strengthBar.bg }}
              />
            </div>
            <p className="mt-1 text-[11px] text-textMuted">
              Strength:{" "}
              <span style={{ color: strengthBar.bg }}>{strengthBar.label}</span>
            </p>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-textMuted">
            Confirm password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text outline-none ring-accent/30 placeholder:text-textDim focus:border-borderBright focus:ring-2"
          />
          {fieldErrors.confirmPassword ? (
            <span className="mt-1 block text-xs" style={{ color: C.danger }}>
              {fieldErrors.confirmPassword}
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg border font-medium transition-opacity disabled:opacity-60"
          style={{
            background: C.accent,
            borderColor: C.accent,
            color: C.text,
          }}
        >
          {submitting ? (
            <>
              <LoadingSpinner size={16} />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>

        <p className="mt-6 text-center text-sm text-textMuted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accentText hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-textMuted">
        {props.label}
      </span>
      <input
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text outline-none ring-accent/30 placeholder:text-textDim focus:border-borderBright focus:ring-2"
      />
      {props.error ? (
        <span className="mt-1 block text-xs" style={{ color: C.danger }}>
          {props.error}
        </span>
      ) : null}
    </label>
  );
}
