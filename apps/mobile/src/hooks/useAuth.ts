import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { serverApi, serverApiPublic } from "../lib/api";
import type { ProjectReference } from "@proposalagent/shared";
import { syncStoredPushTokenToServer } from "../lib/pushNotifications";

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

async function fetchMe(): Promise<User> {
  return serverApi.request<User>("/api/auth/me");
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { token } = await serverApiPublic.request<{ token: string; user: User }>(
        "/api/auth/login",
        { method: "POST", body: credentials }
      );
      await AsyncStorage.setItem("authToken", token);
      return { token };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await syncStoredPushTokenToServer();
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
      const { token } = await serverApiPublic.request<{ token: string; user: User }>(
        "/api/auth/register",
        { method: "POST", body: data }
      );
      await AsyncStorage.setItem("authToken", token);
      return { token };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await syncStoredPushTokenToServer();
    },
  });
}

export async function logout() {
  await AsyncStorage.removeItem("authToken");
}
