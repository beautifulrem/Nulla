import { DEFAULT_UNKNOWN_SPENDER_CAP } from "@/lib/constants";
import type { Address } from "viem";
import type { PolicyConfig } from "@/lib/types";

export function evaluatePolicy(spender: Address, amount: bigint, policy: PolicyConfig): { matched: boolean; reasonMask: number; riskScore: number } {
  let reasonMask = 0;
  let riskScore = 0;

  if (policy.blacklisted) {
    reasonMask |= 2;
    riskScore = 100;
  }

  if (!policy.allowed && amount > DEFAULT_UNKNOWN_SPENDER_CAP) {
    reasonMask |= 1;
    riskScore = Math.max(riskScore, 70);
  }

  if (policy.allowed && amount > policy.cap) {
    reasonMask |= 4;
    riskScore = Math.max(riskScore, 80);
  }

  return { matched: reasonMask > 0, reasonMask, riskScore };
}
