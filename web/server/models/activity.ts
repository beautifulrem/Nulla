import type { AlertRecord, TimelineEntry } from "@/lib/types";
import { buildActivityTimeline } from "@/lib/activity";

export function toActivityResponse(profileId: `0x${string}`, alerts: AlertRecord[], timeline: TimelineEntry[]) {
  return {
    profileId,
    alerts,
    timeline: buildActivityTimeline(alerts, timeline)
  };
}
