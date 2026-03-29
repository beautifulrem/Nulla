import { NextResponse } from "next/server";
import { encodeFunctionData, getAddress } from "viem";
import { getServerEnv } from "@/lib/env";
import { getWalletClient } from "@/server/clients/viem";
import { getPublicClient } from "@/server/clients/viem";
import { shieldGuardAbi } from "@/lib/abis";
import { DEMO_PROFILE_ID } from "@/lib/constants";
import { updateMemoryBundle } from "@/server/state/memory";

export const runtime = "nodejs";

type ExitShieldRequest = {
  chainId: number;
  alertId: `0x${string}`;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExitShieldRequest;
    const env = getServerEnv();
    const chainId = Number(body.chainId);
    const guardAddress =
      chainId === 11155111
        ? env.ETH_GUARD_ADDRESS
        : chainId === 84532
          ? env.BASE_GUARD_ADDRESS
          : undefined;

    if (!guardAddress) {
      return NextResponse.json({ error: "Unsupported chain for manual Shield exit." }, { status: 400 });
    }

    const walletClient = getWalletClient(chainId, env.DEMO_SAFE_OWNER_PRIVATE_KEY ?? env.ETH_SEPOLIA_PRIVATE_KEY);
    if (!walletClient || !walletClient.account) {
      return NextResponse.json({ error: "Missing server-side demo signer." }, { status: 500 });
    }

    const hash = await (walletClient as any).sendTransaction({
      account: walletClient.account,
      to: getAddress(guardAddress),
      data: encodeFunctionData({
        abi: shieldGuardAbi,
        functionName: "exitShieldFromModule",
        args: [body.alertId],
      }),
    });

    await getPublicClient(chainId).waitForTransactionReceipt({ hash });

    updateMemoryBundle(DEMO_PROFILE_ID, (bundle) => {
      if (!bundle) {
        throw new Error("No demo bundle found for Shield exit update.");
      }

      return {
        ...bundle,
        alerts: bundle.alerts.map((alert) =>
          alert.alertId === body.alertId
            ? {
                ...alert,
                resolved: true,
                peerShielded: false,
              }
            : alert,
        ),
        timeline: [
          ...bundle.timeline,
          {
            id: `${body.alertId}:${chainId}:manual-exit` as `0x${string}`,
            alertId: body.alertId,
            chainId: chainId as 11155111 | 84532,
            label: "Shield exit",
            status: "success",
            txHash: hash,
            chainName: chainId === 84532 ? "Base Sepolia" : "Ethereum Sepolia",
          },
        ],
      };
    });

    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to exit Shield mode." },
      { status: 500 },
    );
  }
}
