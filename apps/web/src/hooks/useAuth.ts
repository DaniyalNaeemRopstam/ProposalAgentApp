"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, authHeaders } from "@/lib/api";
import { useAuth, type AuthUser } from "@/context/AuthContext";

export type User = AuthUser;

export type ProfileUpdateData = {
  name?: string;
  email?: string;
  companyName?: string;
};

export interface VoiceProfileData {
  samples: string;
}

export interface ProjectLibraryItem {
  title: string;
  client: string;
  outcome: string;
  stack: string[];
  budget: string;
}

export function useMe() {
  const a = useAuth();
  return {
    data: a.user,
    isLoading: a.isLoading,
    isError: !!a.authError && !a.isLoading,
    error: a.authError,
    refetch: a.refreshUser,
  };
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
      queryClient.invalidateQueries({ queryKey: ["auth"] });
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
        body: JSON.stringify({
          sampleProposals: data.samples
            .split(/\n---\n/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        const message = json?.message || "Failed to save voice profile";
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
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
      queryClient.invalidateQueries({ queryKey: ["auth"] });
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
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
