import { useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { flushPendingMutationQueue } from "../lib/pendingMutations";
import { setupPushRegistration } from "../lib/pushNotifications";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    void setupPushRegistration();
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
      if (t === "job") router.push("/(tabs)/jobs");
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
    };
  }, [router, qc]);

  return <>{children}</>;
}
