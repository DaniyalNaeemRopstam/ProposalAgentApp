"use client";

import { Suspense } from "react";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";

function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsTab />
    </Suspense>
  );
}

export default SettingsPage;