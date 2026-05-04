import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl, parseEnvelope } from "../lib/api";
import type { ProjectReference } from "@proposalagent/shared";

export interface User {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  plan: "free" | "solo" | "pro" | "enterprise";
  avatar?: string;
  voiceProfile?: string;
  projectLibrary: ProjectReference[];
}

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMe(): Promise<User> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/auth/me"), {
    headers: { Accept: "application/json", ...headers },
  });
  if (!res.ok) throw new Error("Failed to fetch user profile");
  const raw = await res.json();
  return parseEnvelope<User>(raw);
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Login failed";
        throw new Error(message);
      }
      const data = await res.json();
      const { token } = parseEnvelope<{ token: string; user: User }>(data);
      await AsyncStorage.setItem("authToken", token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      companyName: string;
    }) => {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Registration failed";
        throw new Error(message);
      }
      const response = await res.json();
      const { token } = parseEnvelope<{ token: string; user: User }>(response);
      await AsyncStorage.setItem("authToken", token);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export async function logout() {
  await AsyncStorage.removeItem("authToken");
}