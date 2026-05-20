"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { isApiUrlMisconfigured } from "@/lib/authApiErrors";
import { getApiBase } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { C } from "@/styles/theme";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authBoot } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const apiMisconfigured = isApiUrlMisconfigured();

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      const from = searchParams.get("from");
      router.replace(
        from && from.startsWith("/") && !from.startsWith("//")
          ? from
          : "/dashboard/jobs"
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-textMuted">
          ProposalAgent · DanielForge Technologies
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-border bg-surface p-4 shadow-[0_0_0_1px_rgba(79,124,255,0.06)] sm:p-6"
        style={{ boxShadow: `0 0 24px ${C.accent}12` }}
      >
        {apiMisconfigured ? (
          <div
            className="mb-4 rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: `${C.warn}55`,
              background: C.warnDim,
              color: C.warn,
            }}
          >
            API URL is not configured. Set NEXT_PUBLIC_API_URL in Vercel to your Railway URL
            (e.g. https://proposalagentapp-production.up.railway.app) and redeploy. Current:{" "}
            {getApiBase() || "missing"}
          </div>
        ) : null}

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

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-textMuted">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text outline-none ring-accent/30 placeholder:text-textDim focus:border-borderBright focus:ring-2"
            placeholder="you@company.com"
          />
          {fieldErrors.email ? (
            <span className="mt-1 block text-xs" style={{ color: C.danger }}>
              {fieldErrors.email}
            </span>
          ) : null}
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-textMuted">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text outline-none ring-accent/30 placeholder:text-textDim focus:border-borderBright focus:ring-2"
            placeholder="••••••••"
          />
          {fieldErrors.password ? (
            <span className="mt-1 block text-xs" style={{ color: C.danger }}>
              {fieldErrors.password}
            </span>
          ) : null}
        </label>

        <div className="mt-2 flex justify-end">
          <span
            className="cursor-not-allowed text-xs text-textDim"
            title="Coming soon"
          >
            Forgot password?
          </span>
        </div>

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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <p className="mt-6 text-center text-sm text-textMuted">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-accentText hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
