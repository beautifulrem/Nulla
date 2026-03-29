"use client";

import { useMemo, useState } from "react";
import { getChainMetadata } from "../../lib/chains";
import type { ChainStateView } from "../../hooks/guardianTypes";
import type { LasnaRuntimeInfo } from "../../lib/types";
import { card, cardGlow, cardInner, eyebrow, formatAddress, monoWrap, subtitle, tertiaryButton, title } from "./ui";
import { ShieldStateBadge } from "./ShieldStateBadge";

type Props = {
  chain: ChainStateView;
  lasnaRuntime?: LasnaRuntimeInfo;
  alertId?: string | null;
  onManualExit?: (chainId: number, alertId: string) => Promise<void>;
};

const ZERO_ALERT_ID = `0x${"0".repeat(64)}`;

export function ChainStatusCard({ chain, lasnaRuntime, alertId, onManualExit }: Props) {
  const chainMeta = getChainMetadata(chain.chainId);
  const [exiting, setExiting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shieldMeta = useMemo(
    () => buildShieldMeta(chain.guardMode, chain.shieldUntilTick, lasnaRuntime),
    [chain.guardMode, chain.shieldUntilTick, lasnaRuntime],
  );

  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={eyebrow}>{chainMeta.name}</div>
            <h2 style={{ ...title, marginTop: 8 }}>{chain.chainName}</h2>
            <p style={subtitle}>Module, guard, and live protection state on this chain.</p>
          </div>
          <ShieldStateBadge mode={chain.guardMode} />
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
          <StatusLine label="Module enabled" value={chain.moduleEnabled ? "Yes" : "No"} positive={chain.moduleEnabled} />
          <StatusLine label="Shield until" value={chain.shieldUntilTick ?? "None"} />
          {shieldMeta ? <StatusLine label="Lasna block" value={shieldMeta.currentBlockLabel} mono /> : null}
          {shieldMeta ? <StatusLine label="Lasna tick" value={shieldMeta.currentTickLabel} mono /> : null}
          {shieldMeta ? <StatusLine label="Estimated exit" value={shieldMeta.estimatedExitLabel} /> : null}
          {shieldMeta ? <StatusLine label="Countdown" value={shieldMeta.countdownLabel} /> : null}
          <StatusLine label="Guard" value={formatAddress(chain.guardAddress)} mono />
          <StatusLine label="Module" value={formatAddress(chain.moduleAddress)} mono />
          <StatusLine label="Last tx" value={formatAddress(chain.lastTxHash, 8, 6)} mono />
        </div>
        {chain.guardMode === "SHIELD" && onManualExit ? (
          <div style={{ display: "grid", gap: 10 }}>
            <button
              type="button"
              disabled={exiting}
              onClick={async () => {
                setExiting(true);
                setLocalError(null);
                try {
                  await onManualExit(chain.chainId, alertId ?? ZERO_ALERT_ID);
                } catch (error) {
                  setLocalError(error instanceof Error ? error.message : "Failed to exit Shield mode.");
                } finally {
                  setExiting(false);
                }
              }}
              style={{ ...tertiaryButton, minHeight: 44, cursor: exiting ? "wait" : "pointer" }}
            >
              {exiting ? "Exiting Shield..." : "Exit Shield now"}
            </button>
            {localError ? (
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(255, 112, 93, 0.28)",
                  background: "rgba(255, 112, 93, 0.12)",
                  color: "#ffd1c7",
                  padding: 12,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {localError}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function buildShieldMeta(
  mode: ChainStateView["guardMode"],
  shieldUntilTick: ChainStateView["shieldUntilTick"],
  lasnaRuntime?: LasnaRuntimeInfo,
) {
  if (mode !== "SHIELD" || shieldUntilTick == null || !lasnaRuntime) {
    return null;
  }

  const currentTick = Number(lasnaRuntime.currentTick);
  const targetTick = Number(shieldUntilTick);
  const ticksRemaining = Math.max(targetTick - currentTick, 0);
  const blocksRemaining = ticksRemaining * Number(lasnaRuntime.cronTickDivisor);
  const secondsRemaining = blocksRemaining * lasnaRuntime.secondsPerBlock;
  const estimatedExit = new Date(Date.now() + secondsRemaining * 1000);

  return {
    currentBlockLabel: lasnaRuntime.currentBlockNumber.toString(),
    currentTickLabel: lasnaRuntime.currentTick.toString(),
    estimatedExitLabel: ticksRemaining > 0 ? estimatedExit.toUTCString().replace("GMT", "UTC") : "Ready to exit",
    countdownLabel: ticksRemaining > 0 ? formatCountdown(secondsRemaining) : "Expired",
  };
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function StatusLine({
  label,
  value,
  mono: isMono,
  positive,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
  positive?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: positive ? "var(--accent-safe)" : "var(--text-primary)",
          ...(isMono ? monoWrap : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}
