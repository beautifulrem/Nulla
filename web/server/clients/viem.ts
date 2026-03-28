import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID, LASNA_CHAIN_ID } from "@/lib/chains";
import { getServerEnv } from "@/lib/env";

function chainFromId(chainId: number) {
  const env = getServerEnv();
  switch (chainId) {
    case ETH_SEPOLIA_CHAIN_ID:
      return {
        id: ETH_SEPOLIA_CHAIN_ID,
        name: "Ethereum Sepolia",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [env.ETH_SEPOLIA_RPC_URL] } }
      };
    case BASE_SEPOLIA_CHAIN_ID:
      return {
        id: BASE_SEPOLIA_CHAIN_ID,
        name: "Base Sepolia",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [env.BASE_SEPOLIA_RPC_URL] } }
      };
    case LASNA_CHAIN_ID:
    default:
      return {
        id: LASNA_CHAIN_ID,
        name: "Lasna",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: [env.LASNA_RPC_URL] } }
      };
  }
}

export function getPublicClient(chainId: number) {
  const env = getServerEnv();
  const transport = http(
    chainId === ETH_SEPOLIA_CHAIN_ID
      ? env.ETH_SEPOLIA_RPC_URL
      : chainId === BASE_SEPOLIA_CHAIN_ID
        ? env.BASE_SEPOLIA_RPC_URL
        : env.LASNA_RPC_URL
  );

  return createPublicClient({
    chain: chainFromId(chainId) as never,
    transport
  });
}

export function getWalletClient(chainId: number, privateKey?: string) {
  if (!privateKey) {
    return null;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const env = getServerEnv();
  const transport = http(
    chainId === ETH_SEPOLIA_CHAIN_ID
      ? env.ETH_SEPOLIA_RPC_URL
      : chainId === BASE_SEPOLIA_CHAIN_ID
        ? env.BASE_SEPOLIA_RPC_URL
        : env.LASNA_RPC_URL
  );

  return createWalletClient({
    account,
    chain: chainFromId(chainId) as never,
    transport
  });
}

export const erc20ReadAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)"
]);
