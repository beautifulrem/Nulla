import { useApiResource } from "./useApiResource";
import { DEFAULT_CHAIN_READINESS, GuardianProfileView } from "./guardianTypes";

const FALLBACK_STATUS: GuardianProfileView = {
  profileId: "",
  safeAddress: "",
  ownerAddress: "",
  policyTitle: "",
  status: "Unset",
  chainReadiness: DEFAULT_CHAIN_READINESS,
  lastAlert: null,
};

export function useGuardianStatus(profileId: string | null) {
  return useApiResource<GuardianProfileView>(
    profileId ? `/api/guardian/${profileId}/status` : null,
    FALLBACK_STATUS,
    5000,
  );
}
