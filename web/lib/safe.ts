"use client";

import type { Eip1193Provider } from "@safe-global/protocol-kit/dist/src/types/safeProvider";
import { getAddress } from "viem";
import type { NextAction } from "./types";

type BrowserEthereum = Eip1193Provider;

function getEthereumProvider(): BrowserEthereum {
  const ethereum = (window as Window & { ethereum?: BrowserEthereum }).ethereum;
  if (!ethereum) {
    throw new Error("No injected wallet was found in the browser.");
  }
  return ethereum;
}

function toHexChainId(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}`;
}

export async function switchWalletChain(chainId: number) {
  const ethereum = getEthereumProvider();
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: toHexChainId(chainId) }]
  });
}

export async function executeSafeNextAction(action: NextAction, safeAddress: string, ownerAddress: string): Promise<string> {
  const ethereum = (window as Window & { ethereum?: BrowserEthereum }).ethereum;
  if (!ethereum) {
    return executeSafeNextActionViaServer(action, safeAddress, ownerAddress);
  }

  const { default: Safe } = await import("@safe-global/protocol-kit");
  await switchWalletChain(action.chainId);

  const protocolKit = await Safe.init({
    provider: ethereum,
    signer: getAddress(ownerAddress),
    safeAddress: getAddress(safeAddress)
  });

  const safeTransaction = await protocolKit.createTransaction({
    transactions: [
      {
        to: getAddress(action.to),
        data: action.data,
        value: action.value.toString()
      }
    ]
  });

  const signed = await protocolKit.signTransaction(safeTransaction);
  const result = await protocolKit.executeTransaction(signed);
  return result.hash;
}

async function executeSafeNextActionViaServer(action: NextAction, safeAddress: string, ownerAddress: string): Promise<string> {
  const response = await fetch("/api/demo/safe-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      safeAddress,
      ownerAddress,
      action: {
        chainId: action.chainId,
        label: action.label,
        description: action.description,
        to: action.to,
        data: action.data,
        value: action.value.toString(),
      },
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Server-side Safe execution failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { hash: string };
  return payload.hash;
}
