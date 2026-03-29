"use client";

import type { GuardMode } from "../../hooks/guardianTypes";
import { card, cardGlow, cardInner, eyebrow, formatAddress, subtitle, title } from "./ui";
import { ShieldStateBadge } from "./ShieldStateBadge";

type Props = {
  armed: boolean;
  profileId?: string;
  statusLabel: string;
  badgeMode?: GuardMode;
};

export function GuardianModeCard({ armed, profileId, statusLabel, badgeMode = "MONITOR" }: Props) {
  return (
    <section style={{ ...card, minHeight: 220 }}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={eyebrow}>
              <span>Guardian Mode</span>
            </div>
            <h2 style={title}>One switch. Two chains. One reactive security loop.</h2>
            <p style={subtitle}>
              The control plane spans Ethereum Sepolia, Base Sepolia, and Reactive Lasna.
            </p>
          </div>
          <ShieldStateBadge mode={badgeMode} />
        </div>
        <div
          style={{
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            padding: 16,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Live status
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)" }}>{statusLabel}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {profileId ? `${armed ? "Profile" : "Pending profile"} ${formatAddress(profileId, 8, 6)}` : "Profile not created yet"}
          </div>
        </div>
      </div>
    </section>
  );
}
