import type { ReactNode } from "react";
import Link from "next/link";
import { C } from "@/styles/theme";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg px-4 py-10 text-text sm:py-16">
      <div className="mx-auto w-full max-w-[400px] flex-1">
        <nav className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-textMuted transition-colors hover:text-text"
          >
            ← Back to home
          </Link>
          <span className="text-textDim" aria-hidden>
            ·
          </span>
          <Link
            href="/dashboard/jobs"
            className="font-medium transition-colors hover:text-accentText"
            style={{ color: C.accentText }}
          >
            Try demo (no account)
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
