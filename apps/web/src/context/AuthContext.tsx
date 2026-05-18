"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl, getApiBase, parseEnvelope } from "@/lib/api";
import { clearPaTokenCookie, setPaTokenCookie } from "@/lib/auth-cookie";
import type { ProjectReference } from "@proposalagent/shared";

/** Shared user shape returned by `/api/auth/me`, login, and register. */
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  plan: "free" | "solo" | "pro" | "enterprise";
  avatar?: string;
  voiceProfile?: string;
  projectLibrary: ProjectReference[];
}

export const PA_TOKEN_STORAGE_KEY = "pa_token";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** No token — preview mode with demo data */
  isGuest: boolean;
  authError: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    companyName: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  const t =
    localStorage.getItem(PA_TOKEN_STORAGE_KEY)?.trim() ||
    localStorage.getItem("token")?.trim() ||
    localStorage.getItem("authToken")?.trim();
  return t || null;
}

function persistToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(PA_TOKEN_STORAGE_KEY, token);
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    setPaTokenCookie(token);
  } else {
    localStorage.removeItem(PA_TOKEN_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    clearPaTokenCookie();
  }
}

/** Browser fetch rejects with TypeError("Failed to fetch") on connection/CORS failures. */
function rethrowFriendlyNetwork(err: unknown): never {
  if (err instanceof TypeError) {
    const base = getApiBase();
    throw new Error(
      base
        ? `Cannot reach the API at ${base}. Start the backend (npm run dev:server) or fix NEXT_PUBLIC_API_URL / CORS.`
        : "Cannot reach the API. Set NEXT_PUBLIC_API_URL (e.g. in apps/web/.env.local) and ensure the backend is running."
    );
  }
  throw err;
}

async function fetchMe(tok: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/api/auth/me"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tok}`,
      },
    });
  } catch (e) {
    rethrowFriendlyNetwork(e);
  }
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      raw && typeof raw === "object" && "message" in raw
        ? String((raw as { message: unknown }).message)
        : "Unauthorized.";
    throw new Error(msg);
  }
  return parseEnvelope<AuthUser>(raw);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = readToken();
    setToken(t);
    if (t) setPaTokenCookie(t);
    setMounted(true);
  }, []);

  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => fetchMe(token!),
    enabled: mounted && !!token,
    retry: false,
  });

  useEffect(() => {
    if (token && meQuery.isError) {
      persistToken(null);
      setToken(null);
      qc.removeQueries({ queryKey: ["auth"] });
    }
  }, [token, meQuery.isError, qc]);

  const user =
    mounted && token && meQuery.isSuccess ? meQuery.data ?? null : null;

  const isLoading = !mounted || (!!token && meQuery.status === "pending");

  const isAuthenticated = !!token && meQuery.isSuccess && !!meQuery.data;

  const isGuest = mounted && !token;

  const login = useCallback(
    async (email: string, password: string) => {
      let res: Response;
      try {
        res = await fetch(apiUrl("/api/auth/login"), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim(), password }),
        });
      } catch (e) {
        rethrowFriendlyNetwork(e);
      }
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          raw && typeof raw === "object" && "message" in raw
            ? String((raw as { message: unknown }).message)
            : "Invalid email or password.";
        throw new Error(msg);
      }
      const data = parseEnvelope<{ token: string; user: AuthUser }>(raw);
      persistToken(data.token);
      setToken(data.token);
      qc.setQueryData(["auth", "me", data.token], data.user);
      await qc.invalidateQueries({ queryKey: ["auth"] });
    },
    [qc]
  );

  const register = useCallback(
    async (dataIn: {
      name: string;
      email: string;
      companyName: string;
      password: string;
    }) => {
      let res: Response;
      try {
        res = await fetch(apiUrl("/api/auth/register"), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dataIn,
            email: dataIn.email.trim(),
            name: dataIn.name.trim(),
            companyName: dataIn.companyName.trim(),
          }),
        });
      } catch (e) {
        rethrowFriendlyNetwork(e);
      }
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          raw && typeof raw === "object" && "message" in raw
            ? String((raw as { message: unknown }).message)
            : "Registration failed.";
        throw new Error(msg);
      }
      const data = parseEnvelope<{ token: string; user: AuthUser }>(raw);
      persistToken(data.token);
      setToken(data.token);
      qc.setQueryData(["auth", "me", data.token], data.user);
      await qc.invalidateQueries({ queryKey: ["auth"] });
    },
    [qc]
  );

  const logout = useCallback(() => {
    persistToken(null);
    setToken(null);
    qc.removeQueries({ queryKey: ["auth"] });
  }, [qc]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    await qc.invalidateQueries({ queryKey: ["auth", "me", token] });
    await meQuery.refetch();
  }, [qc, token, meQuery]);

  const authError =
    mounted && token && meQuery.isError ? (meQuery.error as Error) : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      isGuest,
      authError,
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
      authError,
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
