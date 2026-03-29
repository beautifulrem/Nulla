"use client";

import { getChainMetadata, getExplorerTxUrl } from "../../lib/chains";
import type { AlertView } from "../../hooks/guardianTypes";
import { card, cardGlow, cardInner, eyebrow, formatAddress, monoWrap, subtitle, title } from "./ui";

export function RiskEventCard({ alert }: { alert: AlertView }) {
  const originMeta = getChainMetadata(alert.originChainId);

  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div style={eyebrow}>Latest alert</div>
        <div>
          <h2 style={title}>Detected on {alert.originChainName}</h2>
          <p style={subtitle}>
            Risk score {alert.riskScore} with mask {alert.reasonMask}. The cross-chain timeline below
            resolves the follow-up actions.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gap: 12,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.035)",
            padding: 16,
          }}
        >
          <Fact label="Alert ID" value={formatAddress(alert.alertId, 10, 8)} mono />
          <Fact label="Token" value={formatAddress(alert.token, 8, 6)} mono />
          <Fact label="Spender" value={formatAddress(alert.spender, 8, 6)} mono />
          <Fact label="Detected At" value={alert.detectedAt} />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <TxLink chainId={originMeta.id} label="Lasna / React tx" hash={alert.reactTxHash} />
          <TxLink chainId={originMeta.id} label="Source revoke" hash={alert.sourceRevokeHash} />
          <TxLink chainId={originMeta.id === 11155111 ? 84532 : 11155111} label="Peer shield" hash={alert.peerShieldHash} />
          <TxLink chainId={originMeta.id === 11155111 ? 84532 : 11155111} label="Shield exit" hash={alert.shieldExitHash} />
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value, mono: isMono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-primary)", ...(isMono ? monoWrap : {}) }}>{value}</div>
    </div>
  );
}

function TxLink({ chainId, label, hash }: { chainId: number; label: string; hash?: string | null }) {
  if (!hash) {
    return (
      <div style={{ borderRadius: 16, border: "1px dashed rgba(255,255,255,0.12)", padding: 12, fontSize: 12, color: "var(--text-muted)" }}>
        {label}: Pending
      </div>
    );
  }

  return (
    <a
      href={getExplorerTxUrl(chainId, hash)}
      target="_blank"
      rel="noreferrer"
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7, 14, 29, 0.6)",
        padding: 12,
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--accent-cool)", ...monoWrap }}>{formatAddress(hash, 10, 8)}</div>
    </a>
  );
}
