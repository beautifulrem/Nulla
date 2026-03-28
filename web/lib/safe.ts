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
  const { default: Safe } = await import("@safe-global/protocol-kit");
  const ethereum = getEthereumProvider();
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
