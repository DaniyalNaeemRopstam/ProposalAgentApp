"use client";

import { Suspense } from "react";
import { SettingsTab } from "@/components/settings/SettingsTab";

function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsTab />
    </Suspense>
  );
}

export default SettingsPage;