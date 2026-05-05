"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UpgradeModalProvider, useUpgradeModal } from "@/components/UpgradeModalProvider";
import { registerUpgradeModalHandler } from "@/lib/apiErrors";
import { C } from "@/styles/theme";

function HotToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: C.surface,
          color: C.text,
          border: `1px solid ${C.border}`,
          fontSize: "13px",
        },
        success: {
          iconTheme: { primary: C.success, secondary: C.surface },
          style: { borderColor: `${C.success}55` },
        },
        error: {
          iconTheme: { primary: C.danger, secondary: C.surface },
          style: { borderColor: `${C.danger}55` },
        },
      }}
    />
  );
}

function UpgradeHandlerRegistration() {
  const { open } = useUpgradeModal();
  useEffect(() => {
    registerUpgradeModalHandler(open);
    return () => registerUpgradeModalHandler(null);
  }, [open]);
  return null;
}

export function AppShellProviders({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeModalProvider>
      <ErrorBoundary>
        <UpgradeHandlerRegistration />
        {children}
        <HotToaster />
      </ErrorBoundary>
    </UpgradeModalProvider>
  );
}
