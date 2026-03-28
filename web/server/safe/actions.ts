import { encodeFunctionData } from "viem";
import { safeAbi } from "@/lib/abis";
import type { Address } from "viem";
import type { NextAction } from "@/lib/types";

export function buildEnableModuleAction(chainId: number, safeAddress: Address, moduleAddress: Address): NextAction {
  return {
    chainId: chainId as NextAction["chainId"],
    label: "enableModule",
    description: "Enable the guardian module on the Safe.",
    to: safeAddress,
    data: encodeFunctionData({
      abi: safeAbi,
      functionName: "enableModule",
      args: [moduleAddress]
    }),
    value: 0n
  };
}

export function buildSetGuardAction(chainId: number, safeAddress: Address, guardAddress: Address): NextAction {
  return {
    chainId: chainId as NextAction["chainId"],
    label: "setGuard",
    description: "Install the shield guard on the Safe.",
    to: safeAddress,
    data: encodeFunctionData({
      abi: safeAbi,
      functionName: "setGuard",
      args: [guardAddress]
    }),
    value: 0n
  };
}
