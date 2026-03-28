import { encodeFunctionData, getAddress, keccak256, stringToHex, zeroAddress } from "viem";
import { approvalFirewallModuleAbi, shieldGuardAbi, safeAbi } from "@/lib/abis";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID } from "@/lib/chains";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS } from "@/lib/constants";
import type { Address } from "viem";
import type { ContractAddressBook, GuardianDeploymentPlan, NextAction, OnboardGuardianInput } from "@/lib/types";
import { getServerEnv } from "@/lib/env";
import { buildPolicyHash, buildProfileId, toGuardianProfileRecord } from "@/lib/profile";
import { loadDeploymentManifest } from "./manifest";

function pseudoAddress(seed: string): Address {
  return getAddress(`0x${keccak256(stringToHex(seed)).slice(-40)}`);
}

function buildSafeAction(chainId: number, to: Address, data: `0x${string}`, label: string, description: string): NextAction {
  return {
    chainId: chainId as NextAction["chainId"],
    label,
    description,
    to,
    data,
    value: 0n
  };
}

export function buildGuardianDeploymentPlan(input: OnboardGuardianInput): GuardianDeploymentPlan {
  const env = getServerEnv();
  const manifest = loadDeploymentManifest();
  const profileId = buildProfileId(input);
  const policyHash = buildPolicyHash(input);

  const contracts: ContractAddressBook = {
    registry: env.NULLA_REGISTRY_ADDRESS
      ? getAddress(env.NULLA_REGISTRY_ADDRESS)
      : manifest?.registry ?? pseudoAddress(`${profileId}:registry`),
    safeAddress: input.safeAddress ?? DEMO_SAFE_SHARED_ADDRESS,
    moduleEth: env.ETH_MODULE_ADDRESS
      ? getAddress(env.ETH_MODULE_ADDRESS)
      : manifest?.ethModule ?? pseudoAddress(`${profileId}:module:eth`),
    moduleBase: env.BASE_MODULE_ADDRESS
      ? getAddress(env.BASE_MODULE_ADDRESS)
      : manifest?.baseModule ?? pseudoAddress(`${profileId}:module:base`),
    guardEth: env.ETH_GUARD_ADDRESS
      ? getAddress(env.ETH_GUARD_ADDRESS)
      : manifest?.ethGuard ?? pseudoAddress(`${profileId}:guard:eth`),
    guardBase: env.BASE_GUARD_ADDRESS
      ? getAddress(env.BASE_GUARD_ADDRESS)
      : manifest?.baseGuard ?? pseudoAddress(`${profileId}:guard:base`),
    reactiveLasna: env.REACTIVE_LASNA_ADDRESS
      ? getAddress(env.REACTIVE_LASNA_ADDRESS)
      : manifest?.reactiveLasna ?? pseudoAddress(`${profileId}:reactive:lasna`)
  };

  const profile = toGuardianProfileRecord({
    profileId,
    safeAddress: input.safeAddress ?? DEMO_SAFE_SHARED_ADDRESS,
    ownerAddress: input.ownerAddress ?? DEMO_SAFE_OWNER_ADDRESS,
    moduleEth: contracts.moduleEth,
    moduleBase: contracts.moduleBase,
    guardEth: contracts.guardEth,
    guardBase: contracts.guardBase,
    reactiveLasna: contracts.reactiveLasna,
    policyHash,
    status: "PartialConfigured"
  });

  const enableModuleEth = buildSafeAction(
    ETH_SEPOLIA_CHAIN_ID,
    input.safeAddress,
    encodeFunctionData({
      abi: safeAbi,
      functionName: "enableModule",
      args: [contracts.moduleEth]
    }),
    "Ethereum enableModule",
    "Enable the Ethereum Sepolia module for the shared Safe."
  );

  const enableModuleBase = buildSafeAction(
    BASE_SEPOLIA_CHAIN_ID,
    input.safeAddress,
    encodeFunctionData({
      abi: safeAbi,
      functionName: "enableModule",
      args: [contracts.moduleBase]
    }),
    "Base enableModule",
    "Enable the Base Sepolia module for the shared Safe."
  );

  const setGuardEth = buildSafeAction(
    ETH_SEPOLIA_CHAIN_ID,
    input.safeAddress,
    encodeFunctionData({
      abi: safeAbi,
      functionName: "setGuard",
      args: [contracts.guardEth]
    }),
    "Ethereum setGuard",
    "Install the Ethereum Sepolia shield guard."
  );

  const setGuardBase = buildSafeAction(
    BASE_SEPOLIA_CHAIN_ID,
    input.safeAddress,
    encodeFunctionData({
      abi: safeAbi,
      functionName: "setGuard",
      args: [contracts.guardBase]
    }),
    "Base setGuard",
    "Install the Base Sepolia shield guard."
  );

  return {
    profileId,
    profile,
    contracts,
    nextActions: [enableModuleEth, enableModuleBase, setGuardEth, setGuardBase]
  };
}

export function buildReactPayloadPlan(params: {
  alertId: `0x${string}`;
  sourceChainId: number;
  peerChainId: number;
  token: Address;
  spender: Address;
  amount: bigint;
  reasonMask: number;
  riskScore: number;
  untilTick: bigint;
}): { sourceRevokeData: `0x${string}`; peerShieldData: `0x${string}`; peerShieldExitData: `0x${string}` } {
  return {
    sourceRevokeData: encodeFunctionData({
      abi: approvalFirewallModuleAbi,
      functionName: "revokeApproval",
      args: [
        zeroAddress,
        params.alertId,
        params.token,
        params.spender,
        params.amount,
        params.reasonMask,
        params.riskScore
      ]
    }),
    peerShieldData: encodeFunctionData({
      abi: approvalFirewallModuleAbi,
      functionName: "enterShield",
      args: [zeroAddress, params.alertId, BigInt(params.sourceChainId), params.untilTick, params.riskScore]
    }),
    peerShieldExitData: encodeFunctionData({
      abi: approvalFirewallModuleAbi,
      functionName: "exitShield",
      args: [zeroAddress, params.alertId]
    })
  };
}
