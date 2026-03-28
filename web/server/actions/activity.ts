import { buildActivityTimeline } from "@/lib/activity";
import type { AlertRecord, GuardianActivityResponse, TimelineEntry } from "@/lib/types";
import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID, LASNA_CHAIN_ID } from "@/lib/chains";
import { getMemoryBundle } from "../state/memory";
import { getServerEnv } from "@/lib/env";
import { resolveRuntimeDeployment } from "../deploy/runtime";
import {
  computeAlertId,
  fetchApprovalLogs,
  fetchModuleEventLogs,
  fetchRiskDetectedLogs,
  getLookbackFromBlock,
  logToTimelineEntry
} from "../indexer/logs";

async function getLiveGuardianActivity(profileId: `0x${string}`): Promise<GuardianActivityResponse | null> {
  const bundle = getMemoryBundle(profileId);
  const runtime = resolveRuntimeDeployment(bundle?.profile);
  if (!bundle || !runtime.hasRealAddresses || !runtime.tokenEth || !runtime.tokenBase) {
    return null;
  }

  const fromEth = await getLookbackFromBlock(ETH_SEPOLIA_CHAIN_ID);
  const fromBase = await getLookbackFromBlock(BASE_SEPOLIA_CHAIN_ID);
  const fromLasna = await getLookbackFromBlock(LASNA_CHAIN_ID);

  const [
    ethApprovals,
    baseApprovals,
    riskLogs,
    ethRevokes,
    baseRevokes,
    ethShields,
    baseShields,
    ethShieldExits,
    baseShieldExits
  ] = await Promise.all([
    fetchApprovalLogs(ETH_SEPOLIA_CHAIN_ID, runtime.tokenEth, bundle.profile.safeAddress, fromEth),
    fetchApprovalLogs(BASE_SEPOLIA_CHAIN_ID, runtime.tokenBase, bundle.profile.safeAddress, fromBase),
    fetchRiskDetectedLogs(runtime.contracts.reactiveLasna, fromLasna),
    fetchModuleEventLogs(ETH_SEPOLIA_CHAIN_ID, runtime.contracts.moduleEth, "ApprovalRevoked", fromEth),
    fetchModuleEventLogs(BASE_SEPOLIA_CHAIN_ID, runtime.contracts.moduleBase, "ApprovalRevoked", fromBase),
    fetchModuleEventLogs(ETH_SEPOLIA_CHAIN_ID, runtime.contracts.moduleEth, "ShieldEntered", fromEth),
    fetchModuleEventLogs(BASE_SEPOLIA_CHAIN_ID, runtime.contracts.moduleBase, "ShieldEntered", fromBase),
    fetchModuleEventLogs(ETH_SEPOLIA_CHAIN_ID, runtime.contracts.moduleEth, "ShieldExited", fromEth),
    fetchModuleEventLogs(BASE_SEPOLIA_CHAIN_ID, runtime.contracts.moduleBase, "ShieldExited", fromBase)
  ]);

  const alerts = new Map<`0x${string}`, AlertRecord>();
  const timeline: TimelineEntry[] = [];

  for (const log of [...ethApprovals, ...baseApprovals]) {
    if (!log.args.spender || !log.transactionHash) {
      continue;
    }
    const sourceChainId = log.address === runtime.tokenEth ? ETH_SEPOLIA_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID;
    const alertId = computeAlertId(
      sourceChainId,
      bundle.profile.safeAddress,
      log.address,
      log.args.spender,
      log.transactionHash,
      BigInt(log.logIndex)
    );
    timeline.push(logToTimelineEntry(sourceChainId, alertId, "Origin approval", "info", log.transactionHash));
  }

  for (const rawLog of riskLogs) {
    const log = rawLog as {
      args: {
        alertId?: `0x${string}`;
        originChainId?: bigint;
        token?: `0x${string}`;
        spender?: `0x${string}`;
        amount?: bigint;
        reasonMask?: number | bigint;
        riskScore?: number | bigint;
      };
      blockNumber?: bigint;
      transactionHash?: `0x${string}`;
    };
    if (
      !log.args.alertId ||
      log.args.originChainId === undefined ||
      !log.args.token ||
      !log.args.spender ||
      log.args.amount === undefined ||
      log.args.reasonMask === undefined ||
      log.args.riskScore === undefined
    ) {
      continue;
    }
    const alertId = log.args.alertId as `0x${string}`;
    alerts.set(alertId, {
      alertId,
      originChainId: Number(log.args.originChainId) as AlertRecord["originChainId"],
      safeAddress: bundle.profile.safeAddress,
      token: log.args.token,
      spender: log.args.spender,
      amount: BigInt(log.args.amount),
      reasonMask: Number(log.args.reasonMask),
      riskScore: Number(log.args.riskScore),
      createdTick: BigInt(log.blockNumber ?? 0n),
      shieldUntilTick: 0n,
      sourceRevoked: false,
      peerShielded: false,
      resolved: false
    });
    timeline.push(logToTimelineEntry(LASNA_CHAIN_ID, alertId, "Lasna REACT tx", "warning", log.transactionHash));
  }

  for (const rawLog of [...ethRevokes, ...baseRevokes]) {
    const log = rawLog as {
      address: `0x${string}`;
      transactionHash?: `0x${string}`;
      args: { alertId?: `0x${string}` };
    };
    if (!log.args.alertId) {
      continue;
    }
    const alertId = log.args.alertId as `0x${string}`;
    const current = alerts.get(alertId);
    if (current) {
      current.sourceRevoked = true;
      alerts.set(alertId, current);
    }
    timeline.push(
      logToTimelineEntry(
        log.address === runtime.contracts.moduleEth ? ETH_SEPOLIA_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
        alertId,
        "Source revoke",
        "success",
        log.transactionHash
      )
    );
  }

  for (const rawLog of [...ethShields, ...baseShields]) {
    const log = rawLog as {
      address: `0x${string}`;
      transactionHash?: `0x${string}`;
      args: { alertId?: `0x${string}`; untilTick?: bigint };
    };
    if (!log.args.alertId || log.args.untilTick === undefined) {
      continue;
    }
    const alertId = log.args.alertId as `0x${string}`;
    const current = alerts.get(alertId);
    if (current) {
      current.peerShielded = true;
      current.shieldUntilTick = BigInt(log.args.untilTick);
      alerts.set(alertId, current);
    }
    timeline.push(
      logToTimelineEntry(
        log.address === runtime.contracts.moduleEth ? ETH_SEPOLIA_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
        alertId,
        "Peer shield",
        "warning",
        log.transactionHash
      )
    );
  }

  for (const rawLog of [...ethShieldExits, ...baseShieldExits]) {
    const log = rawLog as {
      address: `0x${string}`;
      transactionHash?: `0x${string}`;
      args: { alertId?: `0x${string}` };
    };
    if (!log.args.alertId) {
      continue;
    }
    const alertId = log.args.alertId as `0x${string}`;
    const current = alerts.get(alertId);
    if (current) {
      current.resolved = true;
      alerts.set(alertId, current);
    }
    timeline.push(
      logToTimelineEntry(
        log.address === runtime.contracts.moduleEth ? ETH_SEPOLIA_CHAIN_ID : BASE_SEPOLIA_CHAIN_ID,
        alertId,
        "Shield exit",
        "success",
        log.transactionHash
      )
    );
  }

  return {
    profileId,
    alerts: [...alerts.values()],
    timeline: buildActivityTimeline([...alerts.values()], timeline)
  };
}

export async function getGuardianActivity(profileId: `0x${string}`): Promise<GuardianActivityResponse> {
  getServerEnv();

  const live = await getLiveGuardianActivity(profileId);
  if (live) {
    return live;
  }

  const bundle = getMemoryBundle(profileId);
  if (!bundle) {
    return {
      profileId,
      alerts: [],
      timeline: []
    };
  }

  return {
    profileId,
    alerts: bundle.alerts,
    timeline: buildActivityTimeline(bundle.alerts, bundle.timeline)
  };
}
