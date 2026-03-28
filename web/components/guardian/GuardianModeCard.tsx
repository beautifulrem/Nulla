"use client";

import { card, cardInner, subtitle, title } from "./ui";
import { ShieldStateBadge } from "./ShieldStateBadge";

type Props = {
  armed: boolean;
  profileId?: string;
  statusLabel: string;
};

export function GuardianModeCard({ armed, profileId, statusLabel }: Props) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={title}>Guardian Mode</h2>
            <p style={subtitle}>One switch. Two chains. One reactive policy layer.</p>
          </div>
          <ShieldStateBadge mode={armed ? "SHIELD" : "MONITOR"} />
        </div>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ fontSize: 14, color: "rgba(229,238,252,0.78)" }}>{statusLabel}</div>
          <div style={{ fontSize: 12, color: "rgba(229,238,252,0.58)" }}>
            {profileId ? `Profile ${profileId}` : "Profile not created yet"}
          </div>
        </div>
      </div>
    </section>
  );
}
