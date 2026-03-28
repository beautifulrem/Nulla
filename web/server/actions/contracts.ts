import { buildDemoContractAddressBook } from "@/lib/contracts";
import { getAddress } from "viem";
import type { GuardianContractsResponse } from "@/lib/types";
import { getMemoryBundle } from "../state/memory";
import { getServerEnv } from "@/lib/env";

export async function getGuardianContracts(profileId: `0x${string}`): Promise<GuardianContractsResponse> {
  const env = getServerEnv();
  const registry = env.NULLA_REGISTRY_ADDRESS ? getAddress(env.NULLA_REGISTRY_ADDRESS) : undefined;

  const bundle = getMemoryBundle(profileId);
  return {
    profileId,
    contracts: bundle
      ? {
          registry,
          safeAddress: bundle.profile.safeAddress,
          serviceEth: env.ETH_SERVICE_ADDRESS ? getAddress(env.ETH_SERVICE_ADDRESS) : undefined,
          serviceBase: env.BASE_SERVICE_ADDRESS ? getAddress(env.BASE_SERVICE_ADDRESS) : undefined,
          moduleEth: bundle.profile.moduleEth,
          moduleBase: bundle.profile.moduleBase,
          guardEth: bundle.profile.guardEth,
          guardBase: bundle.profile.guardBase,
          reactiveLasna: bundle.profile.reactiveLasna
        }
      : buildDemoContractAddressBook({ registry })
  };
}
