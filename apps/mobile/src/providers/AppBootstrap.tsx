import { useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { flushPendingMutationQueue } from "../lib/pendingMutations";
import { setupPushRegistration } from "../lib/pushNotifications";
import { registerBackgroundJobFetch } from "../tasks/backgroundJobFetch";
import { InAppBanner } from "../components/InAppBanner";

interface BannerState {
  visible: boolean;
  title: string;
  subtitle?: string;
  jobId?: string;
}

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<BannerState>({ visible: false, title: "" });

  const handleBannerDismiss = useCallback(() => {
    setBanner({ visible: false, title: "" });
  }, []);

  const handleBannerPress = useCallback(() => {
    handleBannerDismiss();
    if (banner.jobId) {
      router.push(`/(tabs)/jobs?highlight=${banner.jobId}`);
    } else {
      router.push("/(tabs)/jobs");
    }
  }, [banner.jobId, handleBannerDismiss, router]);

  useEffect(() => {
    void setupPushRegistration();
    void registerBackgroundJobFetch();
    void flushPendingMutationQueue(qc);

    const unsubNet = NetInfo.addEventListener((state) => {
      const reachable =
        state.isConnected !== false &&
        state.isInternetReachable !== false;
      if (reachable) {
        void flushPendingMutationQueue(qc);
      }
    });

    function routeFromNotification(data: Record<string, unknown> | undefined) {
      const t = data?.type;
      if (t === "job") {
        const jobId = data?.jobId as string | undefined;
        router.push(`/(tabs)/jobs${jobId ? `?highlight=${jobId}` : ""}`);
      }
      if (t === "sequence") router.push("/(tabs)/sequences");
    }

    const subOpen = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data =
          response.notification.request.content.data as
            | Record<string, unknown>
            | undefined;
        routeFromNotification(data);
      }
    );

    const subReceived = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data =
          notification.request.content.data as Record<string, unknown> | undefined;
        
        if (data?.screen === "jobs") {
          const title = (data?.title as string) || "⚡ New job match";
          const subtitle = (data?.body as string) || "";
          const jobId = (data?.jobId as string) || undefined;
          
          setBanner({
            visible: true,
            title,
            subtitle,
            jobId,
          });
        }
      }
    );

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (!last) return;
      const data =
        last.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
      routeFromNotification(data);
    });

    return () => {
      unsubNet();
      subOpen.remove();
      subReceived.remove();
    };
  }, [router, qc]);

  return (
    <>
      {banner.visible && (
        <InAppBanner
          title={banner.title}
          subtitle={banner.subtitle}
          onPress={handleBannerPress}
          onDismiss={handleBannerDismiss}
          autoDismissMs={4000}
        />
      )}
      {children}
    </>
  );
}
