import { getAddress, type Address } from "viem";
import { getServerEnv } from "@/lib/env";
import type { NextAction } from "@/lib/types";

function normalizePrivateKey(value?: string): `0x${string}` {
  if (!value) {
    throw new Error("Missing demo signer private key on the server.");
  }
  return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
}

function rpcUrlForChain(chainId: number, env: ReturnType<typeof getServerEnv>) {
  switch (chainId) {
    case 11155111:
      return env.ETH_SEPOLIA_RPC_URL;
    case 84532:
      return env.BASE_SEPOLIA_RPC_URL;
    case 5318007:
      return env.LASNA_RPC_URL;
    default:
      throw new Error(`Unsupported demo chain: ${chainId}`);
  }
}

export async function executeSafeServerAction(action: NextAction, safeAddress: Address, ownerPrivateKey?: string) {
  const env = getServerEnv();
  const signer = normalizePrivateKey(ownerPrivateKey ?? env.DEMO_SAFE_OWNER_PRIVATE_KEY ?? env.ETH_SEPOLIA_PRIVATE_KEY);
  const provider = rpcUrlForChain(Number(action.chainId), env);

  const { default: Safe } = await import("@safe-global/protocol-kit");
  const protocolKit = await Safe.init({
    provider,
    signer,
    safeAddress: getAddress(safeAddress),
  });

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [
      {
        to: getAddress(action.to),
        data: action.data,
        value: action.value.toString(),
      },
    ],
  });

  const signed = await protocolKit.signTransaction(safeTransaction);
  const result = await protocolKit.executeTransaction(signed);
  return result.hash;
}
