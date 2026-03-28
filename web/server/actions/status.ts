import { DEFAULT_POLICY_LABEL } from "@/lib/constants";
import { getMemoryBundle } from "../state/memory";
import { createDefaultChainStates, createDefaultProfile, toGuardianStatusResponse } from "../models/guardian";
import { buildDemoContractAddressBook } from "@/lib/contracts";
import type { ChainStateRecord, GuardianProfileRecord, GuardianStatusResponse } from "@/lib/types";
import { getServerEnv } from "@/lib/env";
import { resolveRuntimeDeployment } from "../deploy/runtime";
import { getPublicClient } from "../clients/viem";
import { safeAbi, shieldGuardAbi } from "@/lib/abis";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID, getChainName } from "@/lib/chains";
import { getGuardianActivity } from "./activity";

export async function getGuardianStatus(profileId: `0x${string}`): Promise<GuardianStatusResponse> {
  getServerEnv();

  const bundle = getMemoryBundle(profileId);
  const runtime = resolveRuntimeDeployment(bundle?.profile);

  if (bundle && runtime.hasRealAddresses) {
    const [ethModuleEnabled, baseModuleEnabled, ethMode, baseMode, ethShieldUntilTick, baseShieldUntilTick, activity] = await Promise.all([
      getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
        address: bundle.profile.safeAddress,
        abi: safeAbi,
        functionName: "isModuleEnabled",
        args: [runtime.contracts.moduleEth]
      }),
      getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
        address: bundle.profile.safeAddress,
        abi: safeAbi,
        functionName: "isModuleEnabled",
        args: [runtime.contracts.moduleBase]
      }),
      getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
        address: runtime.contracts.guardEth,
        abi: shieldGuardAbi,
        functionName: "mode"
      }),
      getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
        address: runtime.contracts.guardBase,
        abi: shieldGuardAbi,
        functionName: "mode"
      }),
      getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
        address: runtime.contracts.guardEth,
        abi: shieldGuardAbi,
        functionName: "shieldUntilTick"
      }),
      getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
        address: runtime.contracts.guardBase,
        abi: shieldGuardAbi,
        functionName: "shieldUntilTick"
      }),
      getGuardianActivity(profileId)
    ]);

    const chains: ChainStateRecord[] = [
      {
        chainId: ETH_SEPOLIA_CHAIN_ID,
        chainName: getChainName(ETH_SEPOLIA_CHAIN_ID),
        safeAddress: bundle.profile.safeAddress,
        moduleAddress: runtime.contracts.moduleEth,
        guardAddress: runtime.contracts.guardEth,
        moduleEnabled: Boolean(ethModuleEnabled),
        guardMode: Number(ethMode) === 1 ? "Shield" : "Monitor",
        shieldUntilTick: BigInt(ethShieldUntilTick),
        lastAlertId: activity.alerts.at(-1)?.alertId
      },
      {
        chainId: BASE_SEPOLIA_CHAIN_ID,
        chainName: getChainName(BASE_SEPOLIA_CHAIN_ID),
        safeAddress: bundle.profile.safeAddress,
        moduleAddress: runtime.contracts.moduleBase,
        guardAddress: runtime.contracts.guardBase,
        moduleEnabled: Boolean(baseModuleEnabled),
        guardMode: Number(baseMode) === 1 ? "Shield" : "Monitor",
        shieldUntilTick: BigInt(baseShieldUntilTick),
        lastAlertId: activity.alerts.at(-1)?.alertId
      }
    ];

    const profile: GuardianProfileRecord = {
      ...bundle.profile,
      moduleEth: runtime.contracts.moduleEth,
      moduleBase: runtime.contracts.moduleBase,
      guardEth: runtime.contracts.guardEth,
      guardBase: runtime.contracts.guardBase,
      reactiveLasna: runtime.contracts.reactiveLasna,
      status: chains.every((chain) => chain.moduleEnabled) ? "Active" : "PartialConfigured"
    };

    return {
      profileId,
      profile,
      chains,
      armed: profile.status === "Active",
      shieldEth: chains.some((chain) => chain.chainId === ETH_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
      shieldBase: chains.some((chain) => chain.chainId === BASE_SEPOLIA_CHAIN_ID && chain.guardMode === "Shield"),
      lastAlert: activity.alerts.at(-1),
      policySummary: DEFAULT_POLICY_LABEL
    };
  }

  if (bundle) {
    return {
      profileId,
      profile: bundle.profile,
      chains: bundle.chains,
      armed: bundle.profile.status === "Active",
      shieldEth: bundle.chains.some((chain) => chain.chainId === 11155111 && chain.guardMode === "Shield"),
      shieldBase: bundle.chains.some((chain) => chain.chainId === 84532 && chain.guardMode === "Shield"),
      lastAlert: bundle.alerts.at(-1),
      policySummary: DEFAULT_POLICY_LABEL
    };
  }

  const contracts = buildDemoContractAddressBook();
  const profile = createDefaultProfile(profileId, contracts);
  const chains = createDefaultChainStates(profile);
  return toGuardianStatusResponse(profile, chains);
}
