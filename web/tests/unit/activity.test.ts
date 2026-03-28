import { describe, expect, it } from "vitest";

type ActivityEvent = {
  alertId: string;
  chainId: number;
  step: "RiskDetected" | "REACT" | "SourceRevoke" | "PeerShield" | "ShieldExit";
  txHash: string;
  createdAt: number;
};

function groupByAlertId(events: ActivityEvent[]) {
  return events.reduce<Record<string, ActivityEvent[]>>((acc, event) => {
    acc[event.alertId] ??= [];
    acc[event.alertId].push(event);
    acc[event.alertId].sort((a, b) => a.createdAt - b.createdAt);
    return acc;
  }, {});
}

describe("activity aggregation", () => {
  it("groups source, reactive, and peer-chain steps by alertId", () => {
    const alertId = "0xalert";
    const grouped = groupByAlertId([
      { alertId, chainId: 84532, step: "SourceRevoke", txHash: "0x2", createdAt: 20 },
      { alertId, chainId: 5318007, step: "REACT", txHash: "0x1", createdAt: 10 },
      { alertId, chainId: 11155111, step: "PeerShield", txHash: "0x3", createdAt: 30 },
    ]);

    expect(grouped[alertId].map((e) => e.step)).toEqual(["REACT", "SourceRevoke", "PeerShield"]);
  });
});
