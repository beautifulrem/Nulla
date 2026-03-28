import type { Address } from "viem";

export const ETH_SEPOLIA_CHAIN_ID = 11155111;
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const LASNA_CHAIN_ID = 5318007;

export type SupportedChainId =
  | typeof ETH_SEPOLIA_CHAIN_ID
  | typeof BASE_SEPOLIA_CHAIN_ID
  | typeof LASNA_CHAIN_ID;

export interface ChainMetadata {
  id: SupportedChainId;
  name: string;
  shortName: string;
  explorerBaseUrl: string;
  testnet: boolean;
}

export const CHAIN_METADATA: Record<SupportedChainId, ChainMetadata> = {
  [ETH_SEPOLIA_CHAIN_ID]: {
    id: ETH_SEPOLIA_CHAIN_ID,
    name: "Ethereum Sepolia",
    shortName: "eth-sepolia",
    explorerBaseUrl: "https://sepolia.etherscan.io",
    testnet: true
  },
  [BASE_SEPOLIA_CHAIN_ID]: {
    id: BASE_SEPOLIA_CHAIN_ID,
    name: "Base Sepolia",
    shortName: "base-sepolia",
    explorerBaseUrl: "https://sepolia.basescan.org",
    testnet: true
  },
  [LASNA_CHAIN_ID]: {
    id: LASNA_CHAIN_ID,
    name: "Lasna",
    shortName: "lasna",
    explorerBaseUrl: "https://lasna.scan",
    testnet: true
  }
};

export function getChainMetadata(chainId: number): ChainMetadata {
  return CHAIN_METADATA[chainId as SupportedChainId] ?? CHAIN_METADATA[ETH_SEPOLIA_CHAIN_ID];
}

export function getChainName(chainId: number): string {
  return getChainMetadata(chainId).name;
}

export function getExplorerAddressUrl(chainId: number, address: Address): string {
  return `${getChainMetadata(chainId).explorerBaseUrl}/address/${address}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return `${getChainMetadata(chainId).explorerBaseUrl}/tx/${txHash}`;
}
