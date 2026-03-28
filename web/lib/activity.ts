import { BASE_SEPOLIA_CHAIN_ID, ETH_SEPOLIA_CHAIN_ID } from "./chains";
import { sortTimelineEntries } from "./timeline";
import type { AlertRecord, TimelineEntry } from "./types";

export function buildActivityTimeline(alerts: AlertRecord[], entries: TimelineEntry[]): TimelineEntry[] {
  const alertEntries = alerts.flatMap((alert) => {
    const sourceLabel = alert.sourceRevoked ? "Source revoke" : "Source pending";
    const peerLabel = alert.peerShielded ? "Peer shield" : "Peer pending";
    const resolveLabel = alert.resolved ? "Shield exit" : "Shield active";
    const detectedDetails: TimelineEntry["details"] = {
      sourceChainId: alert.originChainId,
      amount: alert.amount.toString(),
      reasonMask: alert.reasonMask,
      riskScore: alert.riskScore
    };
    const sourceDetails: TimelineEntry["details"] = {
      sourceRevoked: alert.sourceRevoked
    };
    const peerDetails: TimelineEntry["details"] = {
      peerShielded: alert.peerShielded,
      shieldUntilTick: alert.shieldUntilTick.toString()
    };
    const resolveDetails: TimelineEntry["details"] = {
      resolved: alert.resolved
    };

    return [
      {
        id: `${alert.alertId}:detected` as `0x${string}`,
        alertId: alert.alertId,
        chainId: alert.originChainId,
        label: "RiskDetected",
        status: "warning" as const,
        chainName: "",
        details: detectedDetails
      },
      {
        id: `${alert.alertId}:source` as `0x${string}`,
        alertId: alert.alertId,
        chainId: alert.originChainId,
        label: sourceLabel,
        status: alert.sourceRevoked ? "success" : "pending",
        chainName: "",
        details: sourceDetails
      },
      {
        id: `${alert.alertId}:peer` as `0x${string}`,
        alertId: alert.alertId,
        chainId: alert.originChainId === ETH_SEPOLIA_CHAIN_ID ? BASE_SEPOLIA_CHAIN_ID : ETH_SEPOLIA_CHAIN_ID,
        label: peerLabel,
        status: alert.peerShielded ? "warning" : "pending",
        chainName: "",
        details: peerDetails
      },
      {
        id: `${alert.alertId}:resolve` as `0x${string}`,
        alertId: alert.alertId,
        chainId: alert.originChainId === ETH_SEPOLIA_CHAIN_ID ? BASE_SEPOLIA_CHAIN_ID : ETH_SEPOLIA_CHAIN_ID,
        label: resolveLabel,
        status: alert.resolved ? "success" : "info",
        chainName: "",
        details: resolveDetails
      }
    ] satisfies TimelineEntry[];
  });

  return sortTimelineEntries([...entries, ...alertEntries].map((entry) => ({
    ...entry,
    chainName: entry.chainName || ""
  })));
}
