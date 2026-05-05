import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus(): Pick<
  NetInfoState,
  "isConnected" | "isInternetReachable"
> {
  const [state, setState] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    let alive = true;
    void NetInfo.fetch().then((s) => {
      if (!alive) return;
      setState({
        isConnected: s.isConnected,
        isInternetReachable: s.isInternetReachable,
      });
    });
    const unsub = NetInfo.addEventListener((s) => {
      setState({
        isConnected: s.isConnected,
        isInternetReachable: s.isInternetReachable,
      });
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return state;
}
