"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
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

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  companyName?: string;
}

export interface VoiceProfileData {
  samples: string; // Newline-separated samples
}

export interface ProjectLibraryItem {
  title: string;
  client: string;
  outcome: string;
  stack: string[];
  budget: string;
}

async function fetchMe(): Promise<User> {
  const res = await fetch(apiUrl("/api/auth/me"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const res = await fetch(apiUrl("/api/auth/profile"), {
        method: "PUT",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to update profile";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useSaveVoiceProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VoiceProfileData) => {
      const res = await fetch(apiUrl("/api/auth/voice-profile"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to save voice profile";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectLibraryItem) => {
      const res = await fetch(apiUrl("/api/auth/project-library"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to add project";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useRemoveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(apiUrl(`/api/auth/project-library/${projectId}`), {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to remove project";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}