import { useApiResource } from "./useApiResource";
import type { GuardianActivityResponse } from "../lib/types";

const FALLBACK_ACTIVITY: GuardianActivityResponse = {
  profileId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  alerts: [],
  timeline: []
};

export function useGuardianActivity(profileId: string | null) {
  return useApiResource<GuardianActivityResponse>(
    profileId ? `/api/guardian/${profileId}/activity` : null,
    FALLBACK_ACTIVITY,
    5000,
  );
}
