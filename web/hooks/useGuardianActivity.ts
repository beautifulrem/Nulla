import { useApiResource } from "./useApiResource";
import { DEFAULT_ALERTS, TimelineEntry } from "./guardianTypes";

export function useGuardianActivity(profileId: string | null) {
  return useApiResource<TimelineEntry[]>(
    profileId ? `/api/guardian/${profileId}/activity` : null,
    DEFAULT_ALERTS as unknown as TimelineEntry[],
    5000,
  );
}
