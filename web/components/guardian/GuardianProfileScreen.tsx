"use client";

import { DEMO_SAFE_SHARED_ADDRESS } from "../../lib/constants";
import { getChainName } from "../../lib/chains";
import { useGuardianActivity } from "../../hooks/useGuardianActivity";
import { useGuardianStatus } from "../../hooks/useGuardianStatus";
import { AlertTimeline } from "./AlertTimeline";
import { ChainStatusCard } from "./ChainStatusCard";
import { GuardianModeCard } from "./GuardianModeCard";
import { PolicySummary } from "./PolicySummary";
import { RiskEventCard } from "./RiskEventCard";
import { card, cardGlow, cardInner, contentWrap, eyebrow, formatAddress, grid2, grid3, monoWrap, pageShell, subtitle, title, wrapAnywhere } from "./ui";
import type { GuardianActivityResponse } from "../../lib/types";

const MAINLINE_RC = process.env.NEXT_PUBLIC_REACTIVE_LASNA_ADDRESS ?? "Pending";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function showAddress(address?: string | null) {
  if (!address || address === ZERO_ADDRESS) return undefined;
  return address;
}

function toTimelineKind(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("origin approval")) return "RiskDetected" as const;
  if (label === "RiskDetected") return "RiskDetected" as const;
  if (label === "Lasna REACT tx") return "Lasna REACT tx" as const;
  if (normalized.includes("source")) return "Source revoke" as const;
  if (normalized.includes("revoke")) return "Source revoke" as const;
  if (normalized.includes("shield exit")) return "Shield exit" as const;
  if (normalized.includes("peer") || normalized.includes("shield active")) return "Peer shield" as const;
  return "RiskDetected" as const;
}

function groupTimeline(activity: GuardianActivityResponse | null) {
  if (!activity) {
    return [];
  }

  const alertTitles = new Map(
    activity.alerts.map((alert) => [
      alert.alertId,
      Number(alert.originChainId) === 84532 ? "Base approval triggered response" : "Ethereum approval triggered response",
    ]),
  );

  const grouped = new Map<string, { alertId: string; title: string; originChainName: "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan"; events: { kind: "RiskDetected" | "Lasna REACT tx" | "Source revoke" | "Peer shield" | "Shield exit"; chainName: "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan"; hash?: string | null; label: string; timestamp?: string | null; }[] }>();

  for (const entry of activity.timeline) {
    const resolvedChainName =
      entry.chainName === "Base Sepolia" || entry.chainName === "Lasna / Reactscan" || entry.chainName === "Ethereum Sepolia"
        ? entry.chainName
        : ((getChainName(Number(entry.chainId)) === "Base Sepolia"
            ? "Base Sepolia"
            : getChainName(Number(entry.chainId)) === "Lasna"
              ? "Lasna / Reactscan"
              : "Ethereum Sepolia") as "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan");

    const existing = grouped.get(entry.alertId) ?? {
      alertId: entry.alertId,
      title: alertTitles.get(entry.alertId) ?? "Cross-chain security response",
      originChainName: resolvedChainName,
      events: [],
    };

    existing.events.push({
      kind: toTimelineKind(entry.label),
      chainName: resolvedChainName,
      hash: entry.txHash,
      label: entry.label,
      timestamp: entry.timestamp ?? null,
    });

    grouped.set(entry.alertId, existing);
  }

  return [...grouped.values()];
}

export function GuardianProfileScreen({ profileId }: { profileId: string }) {
  const status = useGuardianStatus(profileId);
  const activity = useGuardianActivity(profileId);
  const profileData = status.data?.profile;
  const statusLabel = status.error
    ? "Console API is not returning a profile yet. Finish onboarding or verify the profile ID."
    : status.loading
      ? "Refreshing live chain state..."
      : status.data?.armed
        ? "Armed and watching both chains"
        : "Contracts are deployed. Final Safe actions are still being verified on-chain.";

  const chainReadiness = status.data?.chains ?? [];
  const lastAlert = status.data?.lastAlert ?? null;
  const groupedTimeline = groupTimeline(activity.data);
  const ethChain = chainReadiness.find((chain) => Number(chain.chainId) === 11155111);
  const baseChain = chainReadiness.find((chain) => Number(chain.chainId) === 84532);
  const lastLasnaTx = [...(activity.data?.timeline ?? [])].reverse().find((entry) => entry.chainId === 5318007 && entry.txHash)?.txHash;
  const guardianBadgeMode =
    status.data?.shieldEth || status.data?.shieldBase ? "SHIELD" : "MONITOR";

  async function handleManualExit(chainId: number, alertId: string) {
    const response = await fetch("/api/demo/exit-shield", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chainId, alertId }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? `Failed to exit Shield mode with status ${response.status}`);
    }

    status.refresh();
    activity.refresh();
  }

  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <section style={{ ...card, padding: 0, marginBottom: 22 }}>
          <div style={cardGlow} />
          <div style={{ ...cardInner, position: "relative", display: "grid", gap: 18 }}>
            <div style={eyebrow}>Guardian console</div>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 62px)", lineHeight: 0.96, letterSpacing: "-0.06em", fontFamily: "var(--font-heading)" }}>
              Cross-chain policy state for one Safe.
            </h1>
            <p style={{ margin: 0, maxWidth: 860, fontSize: 17, lineHeight: 1.75, color: "var(--text-secondary)" }}>
              This console shows the exact path from origin-chain approval risk to Lasna reaction,
              source-chain revoke, peer-chain Shield Mode, and recovery.
            </p>
            <div style={grid3}>
              <SummaryTile label="Protected Safe" value={formatAddress(showAddress(profileData?.safeAddress) ?? DEMO_SAFE_SHARED_ADDRESS, 8, 6)} />
              <SummaryTile label="Owner" value={formatAddress(showAddress(profileData?.ownerAddress) ?? "Pending", 8, 6)} />
              <SummaryTile label="Mainline RC" value={formatAddress(showAddress(profileData?.reactiveLasna) ?? MAINLINE_RC, 8, 6)} />
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gap: 18 }}>
          <GuardianModeCard
            armed={Boolean(status.data && status.data.armed)}
            profileId={profileId}
            statusLabel={statusLabel}
            badgeMode={guardianBadgeMode}
          />

          <div style={grid2}>
              <PolicySummary
              safeAddress={showAddress(profileData?.safeAddress) ?? ""}
              ownerAddress={showAddress(profileData?.ownerAddress) ?? ""}
              policyTitle={status.data?.policySummary}
            />
            {lastAlert ? (
              <RiskEventCard
                alert={{
                  alertId: lastAlert.alertId,
                  originChainId: Number(lastAlert.originChainId),
                  originChainName: Number(lastAlert.originChainId) === 84532 ? "Base Sepolia" : "Ethereum Sepolia",
                  token: lastAlert.token,
                  spender: lastAlert.spender,
                  amount: lastAlert.amount.toString(),
                  reasonMask: lastAlert.reasonMask,
                  riskScore: lastAlert.riskScore,
                  detectedAt: lastAlert.createdTick.toString(),
                  currentStatus: lastAlert.resolved ? "Resolved" : lastAlert.peerShielded ? "Shielded" : lastAlert.sourceRevoked ? "Revoked" : "Detected",
                }}
              />
            ) : (
              <EmptyRiskCard />
            )}
          </div>

          <section style={card}>
            <div style={cardGlow} />
            <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
              <div>
                <div style={eyebrow}>Live chain status</div>
                <h2 style={title}>Three views of the same security event.</h2>
                <p style={subtitle}>
                  Ethereum Sepolia, Lasna / Reactscan, and Base Sepolia should read like one
                  connected response system.
                </p>
              </div>
              <div style={grid3}>
                {ethChain ? (
                  <ChainStatusCard
                    chain={{
                      chainId: Number(ethChain.chainId),
                      chainName: ethChain.chainName as "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan",
                      moduleAddress: ethChain.moduleAddress,
                      guardAddress: ethChain.guardAddress,
                      moduleEnabled: ethChain.moduleEnabled,
                      guardMode: ethChain.guardMode === "Shield" ? "SHIELD" : "MONITOR",
                      shieldUntilTick: Number(ethChain.shieldUntilTick),
                      lastTxHash: ethChain.lastTxHash
                    }}
                    lasnaRuntime={status.data?.lasnaRuntime}
                    alertId={ethChain.lastAlertId ?? status.data?.lastAlert?.alertId}
                    onManualExit={handleManualExit}
                  />
                ) : null}
                <ReactiveControlCard
                  reactiveAddress={showAddress(profileData?.reactiveLasna) ?? MAINLINE_RC}
                  profileId={profileId}
                  latestTxHash={lastLasnaTx}
                  live={Boolean(status.data)}
                  lasnaRuntime={status.data?.lasnaRuntime}
                />
                {baseChain ? (
                  <ChainStatusCard
                    chain={{
                      chainId: Number(baseChain.chainId),
                      chainName: baseChain.chainName as "Ethereum Sepolia" | "Base Sepolia" | "Lasna / Reactscan",
                      moduleAddress: baseChain.moduleAddress,
                      guardAddress: baseChain.guardAddress,
                      moduleEnabled: baseChain.moduleEnabled,
                      guardMode: baseChain.guardMode === "Shield" ? "SHIELD" : "MONITOR",
                      shieldUntilTick: Number(baseChain.shieldUntilTick),
                      lastTxHash: baseChain.lastTxHash
                    }}
                    lasnaRuntime={status.data?.lasnaRuntime}
                    alertId={baseChain.lastAlertId ?? status.data?.lastAlert?.alertId}
                    onManualExit={handleManualExit}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <AlertTimeline
            entries={groupedTimeline}
          />

          <section style={card}>
            <div style={cardGlow} />
            <div style={{ ...cardInner, position: "relative", display: "grid", gap: 12 }}>
              <div style={eyebrow}>Console state</div>
              <h2 style={title}>Current profile synchronization</h2>
              <p style={subtitle}>
                {status.loading
                  ? "Refreshing from API and chain-derived state..."
                  : "Console state stays grouped by alertId so the same cross-chain incident reads as one storyline."}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 14,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--text-primary)", ...wrapAnywhere }}>{value}</div>
    </div>
  );
}

function EmptyRiskCard() {
  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 12 }}>
        <div style={eyebrow}>Latest alert</div>
        <h2 style={title}>No active risk event</h2>
        <p style={subtitle}>
          The profile is armed. When a risky approval hits one chain, this panel will immediately
          show the origin, the spender, and the latest cross-chain result.
        </p>
      </div>
    </section>
  );
}

function ReactiveControlCard({
  reactiveAddress,
  profileId,
  latestTxHash,
  live,
  lasnaRuntime,
}: {
  reactiveAddress: string;
  profileId: string;
  latestTxHash?: string;
  live: boolean;
  lasnaRuntime?: import("../../lib/types").LasnaRuntimeInfo;
}) {
  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div>
          <div style={eyebrow}>Lasna / Reactscan</div>
          <h2 style={{ ...title, marginTop: 8 }}>Reactive control layer</h2>
          <p style={subtitle}>The single policy engine that coordinates cross-chain revoke, shield, and timed recovery.</p>
        </div>
        <div
          style={{
            display: "grid",
            gap: 12,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            padding: 14,
          }}
        >
          <SummaryTile label="Runtime state" value={live ? "Watching and reacting" : "Waiting for runtime data"} />
          <SummaryTile label="RC address" value={formatAddress(reactiveAddress, 8, 6)} />
          <SummaryTile label="Profile" value={formatAddress(profileId, 8, 6)} />
          {lasnaRuntime ? <SummaryTile label="Lasna block" value={lasnaRuntime.currentBlockNumber.toString()} /> : null}
          {lasnaRuntime ? <SummaryTile label="Lasna tick" value={lasnaRuntime.currentTick.toString()} /> : null}
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Latest Lasna tx</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)", ...(monoWrap as object) }}>
              {formatAddress(latestTxHash, 8, 6)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
