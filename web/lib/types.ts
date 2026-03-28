import type { Address } from "viem";
import type { SupportedChainId } from "./chains";

export type Hex = `0x${string}`;

export type ProfileStatus = "Unset" | "PartialConfigured" | "Active";
export type GuardMode = "Monitor" | "Shield";

export interface PolicyConfig {
  cap: bigint;
  allowed: boolean;
  blacklisted: boolean;
}

export interface GuardianProfileRecord {
  profileId: Hex;
  safeAddress: Address;
  ownerAddress: Address;
  moduleEth: Address;
  moduleBase: Address;
  guardEth: Address;
  guardBase: Address;
  reactiveLasna: Address;
  policyHash: Hex;
  status: ProfileStatus;
}

export interface ChainStateRecord {
  chainId: SupportedChainId;
  chainName: string;
  safeAddress: Address;
  moduleAddress: Address;
  guardAddress: Address;
  moduleEnabled: boolean;
  guardMode: GuardMode;
  shieldUntilTick: bigint;
  lastAlertId?: Hex;
  lastTxHash?: Hex;
}

export interface AlertRecord {
  alertId: Hex;
  originChainId: SupportedChainId;
  safeAddress: Address;
  token: Address;
  spender: Address;
  amount: bigint;
  reasonMask: number;
  riskScore: number;
  createdTick: bigint;
  shieldUntilTick: bigint;
  sourceRevoked: boolean;
  peerShielded: boolean;
  resolved: boolean;
}

export interface TimelineEntry {
  id: Hex;
  alertId: Hex;
  chainId: SupportedChainId;
  label: string;
  status: "pending" | "success" | "warning" | "error" | "info";
  txHash?: Hex;
  timestamp?: string;
  chainName: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface ContractAddressBook {
  registry?: Address;
  safeAddress: Address;
  serviceEth?: Address;
  serviceBase?: Address;
  moduleEth: Address;
  moduleBase: Address;
  guardEth: Address;
  guardBase: Address;
  reactiveLasna: Address;
}

export interface NextAction {
  chainId: SupportedChainId;
  label: string;
  description: string;
  to: Address;
  data: Hex;
  value: bigint;
}

export interface GuardianDeploymentPlan {
  profileId: Hex;
  profile: GuardianProfileRecord;
  contracts: ContractAddressBook;
  nextActions: NextAction[];
}

export interface OnboardGuardianInput {
  safeAddress: Address;
  ownerAddress: Address;
  tokenEth: Address;
  tokenBase: Address;
  allowlist: Address[];
  blacklist: Address[];
  cap: bigint;
}

export interface OnboardGuardianResponse extends GuardianDeploymentPlan {
  status: "created" | "reused";
  resumeFrom: "deploy" | "register" | "enable-safe" | "ready";
}

export interface GuardianStatusResponse {
  profileId: Hex;
  profile: GuardianProfileRecord;
  chains: ChainStateRecord[];
  armed: boolean;
  shieldEth: boolean;
  shieldBase: boolean;
  lastAlert?: AlertRecord;
  policySummary: string;
}

export interface GuardianActivityResponse {
  profileId: Hex;
  alerts: AlertRecord[];
  timeline: TimelineEntry[];
}

export interface GuardianContractsResponse {
  profileId: Hex;
  contracts: ContractAddressBook;
}
