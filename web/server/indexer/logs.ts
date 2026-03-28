import { getPublicClient } from "../clients/viem";
import { encodeAbiParameters, keccak256, parseAbiParameters, type Address } from "viem";
import type { TimelineEntry } from "@/lib/types";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID, LASNA_CHAIN_ID, getChainName } from "@/lib/chains";

const riskDetectedEvent = {
  type: "event",
  name: "RiskDetected",
  inputs: [
    { indexed: true, name: "alertId", type: "bytes32" },
    { indexed: true, name: "originChainId", type: "uint256" },
    { indexed: true, name: "token", type: "address" },
    { indexed: false, name: "spender", type: "address" },
    { indexed: false, name: "amount", type: "uint256" },
    { indexed: false, name: "reasonMask", type: "uint8" },
    { indexed: false, name: "riskScore", type: "uint8" }
  ]
} as const;

const moduleEvents = {
  ApprovalRevoked: {
    type: "event",
    name: "ApprovalRevoked",
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ]
  },
  ShieldEntered: {
    type: "event",
    name: "ShieldEntered",
    inputs: [
      { indexed: true, name: "alertId", type: "bytes32" },
      { indexed: true, name: "sourceChainId", type: "uint256" },
      { indexed: false, name: "untilTick", type: "uint64" },
      { indexed: false, name: "riskScore", type: "uint8" }
    ]
  },
  ShieldExited: {
    type: "event",
    name: "ShieldExited",
    inputs: [{ indexed: true, name: "alertId", type: "bytes32" }]
  }
} as const;

export async function fetchApprovalLogs(chainId: number, token: Address, safeAddress: Address, fromBlock?: bigint) {
  const client = getPublicClient(chainId);
  return client.getLogs({
    address: token,
    event: {
      type: "event",
      name: "Approval",
      inputs: [
        { indexed: true, name: "owner", type: "address" },
        { indexed: true, name: "spender", type: "address" },
        { indexed: false, name: "value", type: "uint256" }
      ]
    },
    fromBlock,
    toBlock: "latest",
    args: { owner: safeAddress }
  });
}

export async function fetchReactiveLogs(chainId: number, reactiveAddress: Address, fromBlock?: bigint) {
  const client = getPublicClient(chainId);
  return client.getLogs({
    address: reactiveAddress,
    fromBlock,
    toBlock: "latest"
  });
}

export async function fetchRiskDetectedLogs(reactiveAddress: Address, fromBlock?: bigint) {
  const client = getPublicClient(LASNA_CHAIN_ID);
  return client.getLogs({
    address: reactiveAddress,
    event: riskDetectedEvent,
    fromBlock,
    toBlock: "latest"
  });
}

export async function fetchModuleEventLogs(
  chainId: number,
  moduleAddress: Address,
  eventName: "ApprovalRevoked" | "ShieldEntered" | "ShieldExited",
  fromBlock?: bigint
) {
  const client = getPublicClient(chainId);
  return client.getLogs({
    address: moduleAddress,
    event: moduleEvents[eventName],
    fromBlock,
    toBlock: "latest"
  });
}

export async function getLookbackFromBlock(chainId: number, lookback = 50_000n) {
  const client = getPublicClient(chainId);
  const latest = await client.getBlockNumber();
  return latest > lookback ? latest - lookback : 0n;
}

export function computeAlertId(
  originChainId: number,
  safeAddress: Address,
  token: Address,
  spender: Address,
  txHash: `0x${string}`,
  logIndex: bigint
): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("uint256 originChainId,address safeAddress,address token,address spender,bytes32 txHash,uint256 logIndex"),
      [BigInt(originChainId), safeAddress, token, spender, txHash, logIndex]
    )
  );
}

export function peerChainId(originChainId: number) {
  return originChainId === ETH_SEPOLIA_CHAIN_ID ? BASE_SEPOLIA_CHAIN_ID : ETH_SEPOLIA_CHAIN_ID;
}

export function logToTimelineEntry(chainId: number, alertId: `0x${string}`, label: string, status: TimelineEntry["status"], txHash?: `0x${string}`): TimelineEntry {
  return {
    id: `${alertId}:${chainId}:${label}` as `0x${string}`,
    alertId,
    chainId: chainId as TimelineEntry["chainId"],
    label,
    status,
    txHash,
    chainName: getChainName(chainId)
  };
}
