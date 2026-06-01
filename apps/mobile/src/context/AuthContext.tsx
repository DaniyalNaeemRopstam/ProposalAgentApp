import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DeviceEventEmitter } from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectReference } from "@proposalagent/shared";
import { serverApi, serverApiPublic } from "../lib/api";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../lib/tokenStorage";
import { syncStoredPushTokenToServer } from "../lib/pushNotifications";
import {
  PA_BIOMETRIC_PREF_KEY,
} from "../constants/authStorage";

export { PA_BIOMETRIC_PREF_KEY, PA_BIOMETRIC_ASKED_KEY } from "../constants/authStorage";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  plan: "free" | "solo" | "pro" | "enterprise";
  avatar?: string;
  voiceProfile?: string;
  projectLibrary: ProjectReference[];
  stats?: {
    proposalsSent?: number;
    repliesReceived?: number;
    projectsWon?: number;
    revenueWon?: number;
    winRate?: number;
    replyRate?: number;
  };
}

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    companyName: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchMe(): Promise<AuthUser> {
  return serverApi.request<AuthUser>("/api/auth/me");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getStoredToken();
        if (!alive) return;
        const wantBio =
          (await AsyncStorage.getItem(PA_BIOMETRIC_PREF_KEY)) === "true";
        if (t && wantBio) {
          const has = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          if (has && enrolled) {
            const r = await LocalAuthentication.authenticateAsync({
              promptMessage: "Unlock ProposalAgent",
              cancelLabel: "Use password",
            });
            if (!r.success) {
              await clearStoredToken();
              setToken(null);
              setHydrated(true);
              return;
            }
          }
        }
        setToken(t);
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: fetchMe,
    enabled: hydrated && !!token,
    retry: false,
  });

  useEffect(() => {
    if (hydrated && token && meQuery.isError) {
      void (async () => {
        await clearStoredToken();
        setToken(null);
        qc.removeQueries({ queryKey: ["auth"] });
      })();
    }
  }, [hydrated, token, meQuery.isError, qc]);

  const user =
    hydrated && token && meQuery.isSuccess ? meQuery.data ?? null : null;

  const isLoading =
    !hydrated || (!!token && meQuery.status === "pending");

  const isAuthenticated = !!token && meQuery.isSuccess && !!meQuery.data;

  const isGuest = hydrated && !token;

  const loginMut = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { token: t } = await serverApiPublic.request<{
        token: string;
        user: AuthUser;
      }>("/api/auth/login", { method: "POST", body: credentials });
      await setStoredToken(t);
      return t;
    },
    onSuccess: async (t) => {
      setToken(t);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["sequences"] });
      void qc.invalidateQueries({ queryKey: ["pipeline"] });
      void qc.invalidateQueries({ queryKey: ["analytics"] });
      await syncStoredPushTokenToServer();
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        //
      }
      DeviceEventEmitter.emit("pa-welcome-toast", "Welcome! Generating your profile... ⚡");
    },
  });

  const registerMut = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      companyName: string;
      password: string;
    }) => {
      const { token: t } = await serverApiPublic.request<{
        token: string;
        user: AuthUser;
      }>("/api/auth/register", { method: "POST", body: data });
      await setStoredToken(t);
      return t;
    },
    onSuccess: async (t) => {
      setToken(t);
      await qc.invalidateQueries({ queryKey: ["auth"] });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      void qc.invalidateQueries({ queryKey: ["sequences"] });
      void qc.invalidateQueries({ queryKey: ["pipeline"] });
      void qc.invalidateQueries({ queryKey: ["analytics"] });
      await syncStoredPushTokenToServer();
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        //
      }
      DeviceEventEmitter.emit("pa-welcome-toast", "Welcome! Generating your profile... ⚡");
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMut.mutateAsync({ email: email.trim(), password });
    },
    [loginMut]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      companyName: string;
      password: string;
    }) => {
      await registerMut.mutateAsync(data);
    },
    [registerMut]
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    qc.removeQueries({ queryKey: ["auth"] });
  }, [qc]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    await qc.invalidateQueries({ queryKey: ["auth", "me", token] });
    await meQuery.refetch();
  }, [qc, token, meQuery]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      isGuest,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      isGuest,
      login,
      register,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
