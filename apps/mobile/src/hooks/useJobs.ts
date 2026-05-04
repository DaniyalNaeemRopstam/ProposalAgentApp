import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl, parseEnvelope } from "../lib/api";
import type { Job } from "@proposalagent/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJobs(): Promise<Job[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(apiUrl("/api/jobs"), {
    headers: { Accept: "application/json", ...headers },
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  const raw = await res.json();
  return parseEnvelope<Job[]>(raw);
}

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: {
      title: string;
      description: string;
      budget: string;
      platform: string;
      clientName: string;
      clientCountry: string;
      tags: string[];
    }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(apiUrl("/api/jobs/save"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(jobData),
      });
      if (!res.ok) throw new Error("Failed to save job");
      const raw = await res.json();
      return parseEnvelope(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}