import { useApiResource } from "./useApiResource";
import type { GuardianStatusResponse } from "../lib/types";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS } from "./guardianTypes";

const FALLBACK_STATUS: GuardianStatusResponse = {
  profileId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  profile: {
    profileId: "0x0000000000000000000000000000000000000000000000000000000000000000",
    safeAddress: DEMO_SAFE_ADDRESS,
    ownerAddress: DEMO_OWNER_ADDRESS,
    moduleEth: "0x0000000000000000000000000000000000000000",
    moduleBase: "0x0000000000000000000000000000000000000000",
    guardEth: "0x0000000000000000000000000000000000000000",
    guardBase: "0x0000000000000000000000000000000000000000",
    reactiveLasna: process.env.NEXT_PUBLIC_REACTIVE_LASNA_ADDRESS ?? "0x0000000000000000000000000000000000000000",
    policyHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: "Unset"
  },
  chains: [],
  armed: false,
  shieldEth: false,
  shieldBase: false,
  lastAlert: undefined,
  policySummary: "",
  lasnaRuntime: undefined,
};

export function useGuardianStatus(profileId: string | null) {
  return useApiResource<GuardianStatusResponse>(
    profileId ? `/api/guardian/${profileId}/status` : null,
    FALLBACK_STATUS,
    5000,
  );
}
