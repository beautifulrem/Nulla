import { useApiResource } from "./useApiResource";
import { DEFAULT_CHAIN_READINESS, GuardianProfileView } from "./guardianTypes";

const FALLBACK_PROFILE: GuardianProfileView = {
  profileId: "",
  safeAddress: "",
  ownerAddress: "",
  policyTitle: "",
  status: "Unset",
  chainReadiness: DEFAULT_CHAIN_READINESS,
  lastAlert: null,
};

export function useGuardianProfile(profileId: string | null) {
  return useApiResource<GuardianProfileView>(
    profileId ? `/api/guardian/${profileId}/status` : null,
    FALLBACK_PROFILE,
    5000,
  );
}
