import { keccak256, encodeAbiParameters, parseAbiParameters, type Address } from "viem";
import { DEMO_SAFE_OWNER_ADDRESS, DEMO_SAFE_SHARED_ADDRESS, DEFAULT_POLICY_LABEL } from "./constants";
import type { GuardianProfileRecord, OnboardGuardianInput, PolicyConfig } from "./types";

export const guardianOnboardSchemaShape = {
  safeAddress: DEMO_SAFE_SHARED_ADDRESS,
  ownerAddress: DEMO_SAFE_OWNER_ADDRESS
} as const;

export function buildProfileId(input: {
  safeAddress: Address;
  ownerAddress: Address;
  tokenEth: Address;
  tokenBase: Address;
  allowlist: Address[];
  blacklist: Address[];
  cap: bigint;
}): `0x${string}` {
  return keccak256(
    encodeAbiParameters(parseAbiParameters("address safeAddress,address ownerAddress,address tokenEth,address tokenBase,bytes32 allowlistHash,bytes32 blacklistHash,uint256 cap"), [
      input.safeAddress,
      input.ownerAddress,
      input.tokenEth,
      input.tokenBase,
      keccak256(encodeAbiParameters(parseAbiParameters("address[] allowlist"), [input.allowlist])),
      keccak256(encodeAbiParameters(parseAbiParameters("address[] blacklist"), [input.blacklist])),
      input.cap
    ])
  );
}

export function buildPolicyHash(input: OnboardGuardianInput): `0x${string}` {
  return keccak256(
    encodeAbiParameters(parseAbiParameters("string label,address tokenEth,address tokenBase,uint256 cap,address[] allowlist,address[] blacklist"), [
      DEFAULT_POLICY_LABEL,
      input.tokenEth,
      input.tokenBase,
      input.cap,
      input.allowlist,
      input.blacklist
    ])
  );
}

export function toGuardianProfileRecord(params: {
  profileId: `0x${string}`;
  safeAddress: Address;
  ownerAddress: Address;
  moduleEth: Address;
  moduleBase: Address;
  guardEth: Address;
  guardBase: Address;
  reactiveLasna: Address;
  policyHash: `0x${string}`;
  status?: GuardianProfileRecord["status"];
}): GuardianProfileRecord {
  return {
    profileId: params.profileId,
    safeAddress: params.safeAddress,
    ownerAddress: params.ownerAddress,
    moduleEth: params.moduleEth,
    moduleBase: params.moduleBase,
    guardEth: params.guardEth,
    guardBase: params.guardBase,
    reactiveLasna: params.reactiveLasna,
    policyHash: params.policyHash,
    status: params.status ?? "PartialConfigured"
  };
}

export function normalizePolicyConfig(value?: Partial<PolicyConfig>): PolicyConfig {
  return {
    cap: value?.cap ?? 0n,
    allowed: value?.allowed ?? false,
    blacklisted: value?.blacklisted ?? false
  };
}
