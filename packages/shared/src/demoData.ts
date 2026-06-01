/**
 * Legacy exports — prefer `guestData.ts` (`SAMPLE_*`) for new code.
 */
import type { FollowUpSequence } from "./types";
import {
  guestPipelineGrouped,
  SAMPLE_ANALYTICS,
  SAMPLE_DEALS,
  SAMPLE_SEQUENCES,
  SAMPLE_PIPELINE_TOTAL_VALUE,
} from "./guestData";

export const DEMO_SEQUENCES: FollowUpSequence[] = SAMPLE_SEQUENCES;
export const DEMO_PIPELINE_DEALS = SAMPLE_DEALS;

export function demoPipelineGrouped() {
  return guestPipelineGrouped();
}

export const DEMO_PIPELINE_TOTAL_VALUE = SAMPLE_PIPELINE_TOTAL_VALUE;

export const DEMO_ANALYTICS_OVERVIEW = SAMPLE_ANALYTICS.overview;
export const DEMO_ANALYTICS_MONTHLY = SAMPLE_ANALYTICS.monthly;
export const DEMO_ANALYTICS_PLATFORMS = SAMPLE_ANALYTICS.platforms;
export const DEMO_ANALYTICS_INSIGHTS = SAMPLE_ANALYTICS.insights;
