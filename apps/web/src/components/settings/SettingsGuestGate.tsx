"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { C } from "@/styles/theme";

export function SettingsGuestGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isGuest, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isGuest) {
      router.replace("/register?reason=settings");
    }
  }, [isGuest, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <LoadingSpinner />
        <p className="text-sm text-textMuted">Loading…</p>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="mb-4 text-textMuted">Redirecting to create your free account…</p>
        <p className="mb-6 text-sm text-text">Create your free account to access settings</p>
        <Link
          href="/register?reason=settings"
          className="inline-flex rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: C.accent }}
        >
          Continue to sign up
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
