import { NextResponse } from "next/server";
import { decodeEventLog, encodeFunctionData, getAddress } from "viem";
import { DEMO_PROFILE_ID, DEMO_SAFE_SHARED_ADDRESS, DEFAULT_RISK_SPENDER } from "@/lib/constants";
import { approvalTopic0, erc20Abi } from "@/lib/abis";
import { executeSafeServerAction } from "@/server/safe/execute";
import { getServerEnv } from "@/lib/env";
import type { AlertRecord, NextAction, TimelineEntry } from "@/lib/types";
import { getPublicClient } from "@/server/clients/viem";
import { computeAlertId, fetchModuleEventLogs, fetchRiskDetectedLogs, logToTimelineEntry } from "@/server/indexer/logs";
import { updateMemoryBundle } from "@/server/state/memory";
import { createDefaultChainStates, createDefaultProfile } from "@/server/models/guardian";
import { resolveRuntimeDeployment } from "@/server/deploy/runtime";

export const runtime = "nodejs";

type DemoRiskRequest = {
  chainId: number;
};

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const body = (await request.json()) as DemoRiskRequest;
    const chainId = Number(body.chainId);
    const runtime = resolveRuntimeDeployment();
    const tokenAddress =
      chainId === 11155111
        ? env.ETH_TOKEN_ADDRESS
        : chainId === 84532
          ? env.BASE_TOKEN_ADDRESS
          : undefined;

    if (!tokenAddress) {
      return NextResponse.json({ error: "Unsupported demo chain for risky approval." }, { status: 400 });
    }

    const action: NextAction = {
      chainId: chainId as NextAction["chainId"],
      label: "Risky approval",
      description: "Trigger the watched cross-chain approval flow from the shared Safe.",
      to: getAddress(tokenAddress),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [DEFAULT_RISK_SPENDER, 100_000_001n],
      }),
      value: 0n,
    };

    const hash = await executeSafeServerAction(action, DEMO_SAFE_SHARED_ADDRESS, env.DEMO_SAFE_OWNER_PRIVATE_KEY);

    const client = getPublicClient(chainId);
    const receipt = await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    const approvalLog = receipt.logs.find((log) => log.address.toLowerCase() === getAddress(tokenAddress).toLowerCase() && log.topics[0]?.toLowerCase() === approvalTopic0.toLowerCase());

    if (approvalLog) {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        eventName: "Approval",
        data: approvalLog.data,
        topics: approvalLog.topics,
      });

      const alertId = computeAlertId(
        chainId,
        DEMO_SAFE_SHARED_ADDRESS,
        getAddress(tokenAddress),
        getAddress(decoded.args.spender),
        hash as `0x${string}`,
        BigInt(approvalLog.logIndex),
      );

      const profile = createDefaultProfile(DEMO_PROFILE_ID, runtime.contracts);
      const sourceChainName = chainId === 84532 ? "Base Sepolia" : "Ethereum Sepolia";
      const peerChainId = chainId === 84532 ? 11155111 : 84532;
      const alert: AlertRecord = {
        alertId,
        originChainId: chainId as AlertRecord["originChainId"],
        safeAddress: DEMO_SAFE_SHARED_ADDRESS,
        token: getAddress(tokenAddress),
        spender: getAddress(decoded.args.spender),
        amount: BigInt(decoded.args.value),
        reasonMask: 1,
        riskScore: 70,
        createdTick: receipt.blockNumber,
        shieldUntilTick: 0n,
        sourceRevoked: false,
        peerShielded: false,
        resolved: false,
      };

      const approvalTimeline: TimelineEntry = logToTimelineEntry(
        chainId,
        alertId,
        `Origin approval on ${sourceChainName}`,
        "warning",
        hash as `0x${string}`,
      );

      let sourceRevokeHash: `0x${string}` | undefined;
      let peerShieldHash: `0x${string}` | undefined;
      let lasnaHash: `0x${string}` | undefined;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const [sourceLatest, peerLatest, lasnaLatest] = await Promise.all([
          getPublicClient(chainId).getBlockNumber(),
          getPublicClient(peerChainId).getBlockNumber(),
          getPublicClient(5318007).getBlockNumber(),
        ]);
        const sourceFromBlock = sourceLatest > 9n ? sourceLatest - 9n : 0n;
        const peerFromBlock = peerLatest > 9n ? peerLatest - 9n : 0n;
        const lasnaFromBlock = lasnaLatest > 5_000n ? lasnaLatest - 5_000n : 0n;

        const [sourceRevokes, peerShields, riskLogs] = await Promise.all([
          fetchModuleEventLogs(chainId, chainId === 84532 ? runtime.contracts.moduleBase : runtime.contracts.moduleEth, "ApprovalRevoked", sourceFromBlock, sourceLatest),
          fetchModuleEventLogs(peerChainId, peerChainId === 84532 ? runtime.contracts.moduleBase : runtime.contracts.moduleEth, "ShieldEntered", peerFromBlock, peerLatest),
          fetchRiskDetectedLogs(runtime.contracts.reactiveLasna, lasnaFromBlock, lasnaLatest),
        ]);

        const matchingRevoke = sourceRevokes.find((log) => (log.args as { alertId?: `0x${string}` }).alertId === alertId);
        const matchingShield = peerShields.find((log) => (log.args as { alertId?: `0x${string}` }).alertId === alertId);
        const matchingRisk = riskLogs.find((log) => (log.args as { alertId?: `0x${string}` }).alertId === alertId);

        if (matchingRevoke) {
          sourceRevokeHash = matchingRevoke.transactionHash;
          alert.sourceRevoked = true;
        }
        if (matchingShield) {
          peerShieldHash = matchingShield.transactionHash;
          alert.peerShielded = true;
          const untilTick = (matchingShield.args as { untilTick?: bigint }).untilTick;
          if (untilTick !== undefined) {
            alert.shieldUntilTick = BigInt(untilTick);
          }
        }
        if (matchingRisk) {
          lasnaHash = matchingRisk.transactionHash;
        }

        if (sourceRevokeHash && peerShieldHash) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }

      const timeline: TimelineEntry[] = [approvalTimeline];
      if (lasnaHash) {
        timeline.push(logToTimelineEntry(5318007, alertId, "Lasna REACT tx", "warning", lasnaHash));
      }
      if (sourceRevokeHash) {
        timeline.push(logToTimelineEntry(chainId, alertId, "Source revoke", "success", sourceRevokeHash));
      }
      if (peerShieldHash) {
        timeline.push(logToTimelineEntry(peerChainId, alertId, "Peer shield", "warning", peerShieldHash));
      }

      updateMemoryBundle(DEMO_PROFILE_ID, (bundle) => ({
        profile: bundle?.profile ?? { ...profile, status: "Active" },
        chains: bundle?.chains ?? createDefaultChainStates({ ...profile, status: "Active" }),
        alerts: [alert],
        timeline,
        nextActions: bundle?.nextActions ?? [],
      }));
    }

    return NextResponse.json({ hash });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run risky approval." },
      { status: 500 },
    );
  }
}
