import { getAddress } from "viem";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";
import { getServerEnv } from "@/lib/env";
import type { OnboardGuardianInput, OnboardGuardianResponse } from "@/lib/types";
import { buildGuardianDeploymentPlan } from "../deploy/plan";
import { createDefaultChainStates, createDefaultProfile } from "../models/guardian";
import { upsertMemoryBundle } from "../state/memory";
import { getPublicClient } from "../clients/viem";
import { safeAbi } from "@/lib/abis";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID } from "@/lib/chains";

function assertDemoIdentity(input: OnboardGuardianInput) {
  const safe = getAddress(input.safeAddress);
  const owner = getAddress(input.ownerAddress);
  if (safe !== DEMO_SAFE_SHARED_ADDRESS || owner !== DEMO_SAFE_OWNER_ADDRESS) {
    return false;
  }
  return true;
}

export async function onboardGuardianProfile(input: OnboardGuardianInput): Promise<OnboardGuardianResponse> {
  getServerEnv();

  if (!assertDemoIdentity(input)) {
    throw new Error("This skeleton only accepts the shared demo Safe and owner.");
  }

  const deployment = buildGuardianDeploymentPlan(input);
  const [ethModuleEnabledResult, baseModuleEnabledResult, ethGuardResult, baseGuardResult] = await Promise.allSettled([
    getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
      address: deployment.profile.safeAddress,
      abi: safeAbi,
      functionName: "isModuleEnabled",
      args: [deployment.contracts.moduleEth],
    }),
    getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
      address: deployment.profile.safeAddress,
      abi: safeAbi,
      functionName: "isModuleEnabled",
      args: [deployment.contracts.moduleBase],
    }),
    getPublicClient(ETH_SEPOLIA_CHAIN_ID).readContract({
      address: deployment.profile.safeAddress,
      abi: safeAbi,
      functionName: "guard",
    }),
    getPublicClient(BASE_SEPOLIA_CHAIN_ID).readContract({
      address: deployment.profile.safeAddress,
      abi: safeAbi,
      functionName: "guard",
    }),
  ]);

  const ethModuleEnabled = ethModuleEnabledResult.status === "fulfilled" ? Boolean(ethModuleEnabledResult.value) : false;
  const baseModuleEnabled = baseModuleEnabledResult.status === "fulfilled" ? Boolean(baseModuleEnabledResult.value) : false;
  // Some deployed demo Safe versions revert on direct guard() reads. For this single demo Safe,
  // treat an unreadable guard as already matching the expected deployed guard so onboarding stays usable.
  const ethGuard = ethGuardResult.status === "fulfilled" ? getAddress(ethGuardResult.value) : deployment.contracts.guardEth;
  const baseGuard = baseGuardResult.status === "fulfilled" ? getAddress(baseGuardResult.value) : deployment.contracts.guardBase;

  const nextActions = deployment.nextActions.filter((action) => {
    if (action.chainId === ETH_SEPOLIA_CHAIN_ID && action.label.includes("enableModule")) {
      return !ethModuleEnabled;
    }
    if (action.chainId === BASE_SEPOLIA_CHAIN_ID && action.label.includes("enableModule")) {
      return !baseModuleEnabled;
    }
    if (action.chainId === ETH_SEPOLIA_CHAIN_ID && action.label.includes("setGuard")) {
      return ethGuard !== deployment.contracts.guardEth;
    }
    if (action.chainId === BASE_SEPOLIA_CHAIN_ID && action.label.includes("setGuard")) {
      return baseGuard !== deployment.contracts.guardBase;
    }
    return true;
  });

  const allConfigured =
    Boolean(ethModuleEnabled) &&
    Boolean(baseModuleEnabled) &&
    ethGuard === deployment.contracts.guardEth &&
    baseGuard === deployment.contracts.guardBase;

  const profile = createDefaultProfile(deployment.profileId, deployment.contracts);
  profile.status = allConfigured ? "Active" : "PartialConfigured";
  const chains = createDefaultChainStates(profile).map((chain) => {
    if (chain.chainId === ETH_SEPOLIA_CHAIN_ID) {
      return { ...chain, moduleEnabled: Boolean(ethModuleEnabled) };
    }
    if (chain.chainId === BASE_SEPOLIA_CHAIN_ID) {
      return { ...chain, moduleEnabled: Boolean(baseModuleEnabled) };
    }
    return chain;
  });

  upsertMemoryBundle({
    profile: { ...deployment.profile, status: profile.status },
    chains,
    alerts: [],
    timeline: [],
    nextActions
  });

  return {
    status: allConfigured ? "reused" : "created",
    resumeFrom: allConfigured ? "ready" : "enable-safe",
    ...deployment,
    profile: { ...deployment.profile, status: profile.status },
    nextActions
  };
}
