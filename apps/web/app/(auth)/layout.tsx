import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16 text-text">
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
