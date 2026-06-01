"use client";

import { Suspense } from "react";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { SettingsGuestGate } from "@/components/settings/SettingsGuestGate";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";

function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsGuestGate>
        <SettingsTab />
      </SettingsGuestGate>
    </Suspense>
  );
}

export default SettingsPage;