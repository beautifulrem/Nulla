import { getChainName } from "./chains";
import type { AlertRecord, TimelineEntry } from "./types";

export function sortTimelineEntries(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (a.alertId !== b.alertId) {
      return a.alertId.localeCompare(b.alertId);
    }
    const timeA = a.timestamp ? Date.parse(a.timestamp) : 0;
    const timeB = b.timestamp ? Date.parse(b.timestamp) : 0;
    return timeA - timeB;
  });
}

export function alertToTimelineEntry(alert: AlertRecord, label: string, chainId: number, status: TimelineEntry["status"], txHash?: `0x${string}`): TimelineEntry {
  return {
    id: `${alert.alertId}:${chainId}:${label}` as `0x${string}`,
    alertId: alert.alertId,
    chainId: chainId as TimelineEntry["chainId"],
    label,
    status,
    txHash,
    chainName: getChainName(chainId),
    details: {
      sourceRevoked: alert.sourceRevoked,
      peerShielded: alert.peerShielded,
      resolved: alert.resolved,
      amount: alert.amount.toString(),
      reasonMask: alert.reasonMask,
      riskScore: alert.riskScore
    }
  };
}

export function groupTimelineByAlertId(entries: TimelineEntry[]): Record<string, TimelineEntry[]> {
  return entries.reduce<Record<string, TimelineEntry[]>>((acc, entry) => {
    acc[entry.alertId] = acc[entry.alertId] ?? [];
    acc[entry.alertId].push(entry);
    return acc;
  }, {});
}
