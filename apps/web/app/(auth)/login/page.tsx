"use client";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-4 py-20">
          <LoadingSpinner />
          <p className="text-sm text-textMuted">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
