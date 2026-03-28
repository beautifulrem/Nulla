import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS, DEFAULT_POLICY_LABEL } from "@/lib/constants";
import { getChainName } from "@/lib/chains";
import type { GuardianProfileRecord, GuardianStatusResponse, ContractAddressBook, ChainStateRecord } from "@/lib/types";
import { createEmptyChainState } from "../state/memory";

export function createDefaultProfile(profileId: `0x${string}`, contracts: ContractAddressBook): GuardianProfileRecord {
  return {
    profileId,
    safeAddress: contracts.safeAddress ?? DEMO_SAFE_SHARED_ADDRESS,
    ownerAddress: DEMO_SAFE_OWNER_ADDRESS,
    moduleEth: contracts.moduleEth,
    moduleBase: contracts.moduleBase,
    guardEth: contracts.guardEth,
    guardBase: contracts.guardBase,
    reactiveLasna: contracts.reactiveLasna,
    policyHash: `0x${"0".repeat(64)}`,
    status: "PartialConfigured"
  };
}

export function createDefaultChainStates(profile: GuardianProfileRecord): ChainStateRecord[] {
  return [
    createEmptyChainState(11155111, getChainName(11155111), profile.safeAddress, profile.moduleEth, profile.guardEth),
    createEmptyChainState(84532, getChainName(84532), profile.safeAddress, profile.moduleBase, profile.guardBase)
  ];
}

export function toGuardianStatusResponse(profile: GuardianProfileRecord, chains: ChainStateRecord[]): GuardianStatusResponse {
  const shieldEth = chains.find((chain) => chain.chainId === 11155111)?.guardMode === "Shield";
  const shieldBase = chains.find((chain) => chain.chainId === 84532)?.guardMode === "Shield";
  return {
    profileId: profile.profileId,
    profile,
    chains,
    armed: profile.status === "Active",
    shieldEth: Boolean(shieldEth),
    shieldBase: Boolean(shieldBase),
    policySummary: DEFAULT_POLICY_LABEL,
    lastAlert: undefined
  };
}
