export const DEMO_SAFE_ADDRESS = "0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0";
export const DEMO_OWNER_ADDRESS = "0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4";
export const DEMO_POLICY_TITLE = "Policy #1: Unknown spender approval > 100 MockUSDC";

export const ETH_SEPOLIA_CHAIN_ID = 11155111;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const LASNA_CHAIN_ID = 5318007;

export type ChainName = "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan";
export type GuardMode = "MONITOR" | "SHIELD";

export type GuardianProfileView = {
  profileId: string;
  safeAddress: string;
  ownerAddress: string;
  policyTitle: string;
  status: "Unset" | "PartialConfigured" | "Active";
  moduleEth?: string;
  moduleBase?: string;
  guardEth?: string;
  guardBase?: string;
  reactiveLasna?: string;
  policyHash?: string;
  chainReadiness: ChainStateView[];
  lastAlert?: AlertView | null;
};

export type ChainStateView = {
  chainId: number;
  chainName: ChainName;
  moduleAddress?: string;
  guardAddress?: string;
  moduleEnabled: boolean;
  guardMode: GuardMode;
  shieldUntilTick?: number | null;
  lastTxHash?: string | null;
};

export type AlertView = {
  alertId: string;
  originChainId: number;
  originChainName: ChainName;
  token: string;
  spender: string;
  amount: string;
  reasonMask: number;
  riskScore: number;
  detectedAt: string;
  reactTxHash?: string | null;
  sourceRevokeHash?: string | null;
  peerShieldHash?: string | null;
  shieldExitHash?: string | null;
  currentStatus: "Detected" | "Revoked" | "Shielded" | "Resolved";
};

export type TimelineEntry = {
  alertId: string;
  title: string;
  originChainName: ChainName;
  events: {
    kind: "RiskDetected" | "Lasna REACT tx" | "Source revoke" | "Peer shield" | "Shield exit";
    chainName: ChainName;
    hash?: string | null;
    label: string;
    timestamp?: string | null;
  }[];
};

export type OnboardGuardianInput = {
  safeAddress: string;
  ownerAddress: string;
  tokenEth: string;
  tokenBase: string;
  allowlist: string[];
  blacklist: string[];
  cap: string;
};

export type OnboardGuardianResult = {
  status?: "created" | "reused";
  resumeFrom?: "deploy" | "register" | "enable-safe" | "ready";
  profileId: string;
  moduleEth: string;
  moduleBase: string;
  guardEth: string;
  guardBase: string;
  reactiveLasna: string;
  nextActions: {
    chainId: number;
    title: string;
    hash?: string;
    description: string;
    to: string;
    data: string;
    value: string;
  }[];
};

export const DEFAULT_ONBOARD_FORM: OnboardGuardianInput = {
  safeAddress: DEMO_SAFE_ADDRESS,
  ownerAddress: DEMO_OWNER_ADDRESS,
  tokenEth: "",
  tokenBase: "",
  allowlist: [""],
  blacklist: [""],
  cap: "100000000",
};

export const DEFAULT_CHAIN_READINESS: ChainStateView[] = [
  {
    chainId: ETH_SEPOLIA_CHAIN_ID,
    chainName: "Ethereum Sepolia",
    moduleEnabled: false,
    guardMode: "MONITOR",
  },
  {
    chainId: BASE_SEPOLIA_CHAIN_ID,
    chainName: "Base Sepolia",
    moduleEnabled: false,
    guardMode: "MONITOR",
  },
  {
    chainId: LASNA_CHAIN_ID,
    chainName: "Lasna / Reactscan",
    moduleEnabled: false,
    guardMode: "MONITOR",
  },
];

export const DEFAULT_ALERTS: AlertView[] = [];
