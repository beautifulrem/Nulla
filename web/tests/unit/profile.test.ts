import { describe, expect, it } from "vitest";

type TimelineEntry = {
  alertId: string;
  chain: "ethereum" | "base" | "lasna";
  kind: "RiskDetected" | "REACT" | "SourceRevoke" | "PeerShield" | "ShieldExit";
  txHash: string;
  timestamp: number;
};

type ProfileView = {
  profileId: string;
  safeAddress: string;
  armed: boolean;
  chainStates: Record<string, { moduleEnabled: boolean; shieldMode: boolean }>;
  timeline: TimelineEntry[];
};

function summarizeProfile(view: ProfileView): string {
  const activeChains = Object.entries(view.chainStates)
    .filter(([, state]) => state.moduleEnabled)
    .map(([chain]) => chain);

  return `${view.profileId}:${activeChains.join(",")}`;
}

describe("guardian profile view", () => {
  it("keeps the fixed demo safe address and armed state", () => {
    const view: ProfileView = {
      profileId: "profile-1",
      safeAddress: "0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0",
      armed: true,
      chainStates: {
        ethereum: { moduleEnabled: true, shieldMode: false },
        base: { moduleEnabled: true, shieldMode: false },
      },
      timeline: [],
    };

    expect(view.safeAddress).toBe("0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0");
    expect(view.armed).toBe(true);
    expect(summarizeProfile(view)).toBe("profile-1:ethereum,base");
  });
});
