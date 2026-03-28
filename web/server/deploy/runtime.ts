import { getAddress, zeroAddress } from "viem";
import type { Address } from "viem";
import { DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";
import type { ContractAddressBook, GuardianProfileRecord } from "@/lib/types";
import { getServerEnv } from "@/lib/env";
import { loadDeploymentManifest } from "./manifest";

export interface RuntimeDeployment {
  contracts: ContractAddressBook;
  tokenEth?: Address;
  tokenBase?: Address;
  hasRealAddresses: boolean;
}

function normalizeAddress(value?: string | Address): Address | undefined {
  return value ? getAddress(value) : undefined;
}

function isRealAddress(value?: Address): value is Address {
  return Boolean(value) && value !== zeroAddress;
}

export function resolveRuntimeDeployment(profile?: GuardianProfileRecord): RuntimeDeployment {
  const env = getServerEnv();
  const manifest = loadDeploymentManifest();

  const contracts: ContractAddressBook = {
    registry: normalizeAddress(env.NULLA_REGISTRY_ADDRESS) ?? manifest?.registry,
    safeAddress: profile?.safeAddress ?? normalizeAddress(env.DEMO_SAFE_SHARED_ADDRESS) ?? DEMO_SAFE_SHARED_ADDRESS,
    serviceEth: normalizeAddress(env.ETH_SERVICE_ADDRESS) ?? manifest?.ethService ?? zeroAddress,
    serviceBase: normalizeAddress(env.BASE_SERVICE_ADDRESS) ?? manifest?.baseService ?? zeroAddress,
    moduleEth: profile?.moduleEth ?? normalizeAddress(env.ETH_MODULE_ADDRESS) ?? manifest?.ethModule ?? zeroAddress,
    moduleBase: profile?.moduleBase ?? normalizeAddress(env.BASE_MODULE_ADDRESS) ?? manifest?.baseModule ?? zeroAddress,
    guardEth: profile?.guardEth ?? normalizeAddress(env.ETH_GUARD_ADDRESS) ?? manifest?.ethGuard ?? zeroAddress,
    guardBase: profile?.guardBase ?? normalizeAddress(env.BASE_GUARD_ADDRESS) ?? manifest?.baseGuard ?? zeroAddress,
    reactiveLasna: profile?.reactiveLasna ?? normalizeAddress(env.REACTIVE_LASNA_ADDRESS) ?? manifest?.reactiveLasna ?? zeroAddress
  };

  const tokenEth = normalizeAddress(env.ETH_TOKEN_ADDRESS) ?? manifest?.ethToken;
  const tokenBase = normalizeAddress(env.BASE_TOKEN_ADDRESS) ?? manifest?.baseToken;

  const hasRealAddresses =
    isRealAddress(contracts.moduleEth) &&
    isRealAddress(contracts.moduleBase) &&
    isRealAddress(contracts.guardEth) &&
    isRealAddress(contracts.guardBase) &&
    isRealAddress(contracts.reactiveLasna) &&
    isRealAddress(tokenEth) &&
    isRealAddress(tokenBase);

  return {
    contracts,
    tokenEth,
    tokenBase,
    hasRealAddresses
  };
}
