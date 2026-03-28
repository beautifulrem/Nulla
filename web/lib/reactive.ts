import { approvalTopic0, cron10Topic0 } from "./abis";
import type { AlertRecord, TimelineEntry } from "./types";

export function isApprovalTopic(topic0: string): boolean {
  return topic0.toLowerCase() === approvalTopic0.toLowerCase();
}

export function isCronTopic(topic0: string): boolean {
  return topic0.toLowerCase() === cron10Topic0.toLowerCase();
}

export function alertSeverityLabel(alert: Pick<AlertRecord, "reasonMask" | "riskScore">): string {
  if (alert.riskScore >= 100) {
    return "critical";
  }
  if (alert.riskScore >= 80) {
    return "high";
  }
  if (alert.reasonMask > 0) {
    return "medium";
  }
  return "info";
}

export function summarizeAlert(alert: AlertRecord): string {
  return `reasonMask=${alert.reasonMask}; score=${alert.riskScore}; revoked=${alert.sourceRevoked}; shield=${alert.peerShielded}`;
}

export function timelineLabelForStatus(status: TimelineEntry["status"]): string {
  switch (status) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "info":
      return "info";
    default:
      return "pending";
  }
}
