import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_FETCH_TASK = "background-job-fetch";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function registerBackgroundJobFetch() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.error("Failed to register background fetch task:", error);
  }
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const token = await SecureStore.getItemAsync("pa_token");
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const response = await fetch(
      `${API_URL}/api/jobs?minScore=85&limit=20&page=1&source=aggregated`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const raw = (await response.json()) as {
      success?: boolean;
      data?: { jobs?: Array<{ _id: string; title: string; budget: string }> };
      jobs?: Array<{ _id: string; title: string; budget: string }>;
    };
    const jobs =
      raw.success === true && raw.data?.jobs
        ? raw.data.jobs
        : raw.jobs ?? [];

    if (jobs.length > 0) {
      // Store in AsyncStorage for next app launch
      const existingJobs = await AsyncStorage.getItem("bg_hot_jobs");
      const existing = existingJobs ? JSON.parse(existingJobs) : [];
      const newJobs = jobs.filter(
        (j) => !existing.some((e: { _id: string }) => e._id === j._id)
      );

      if (newJobs.length > 0) {
        await AsyncStorage.setItem(
          "bg_hot_jobs",
          JSON.stringify([...existing, ...newJobs].slice(-20)) // Keep last 20
        );

        // Send local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⚡ New high-fit jobs",
            body: `${newJobs.length} new matches found`,
            data: {
              screen: "jobs",
              type: "job",
            },
          },
          trigger: null,
        });

        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error("Background fetch task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
