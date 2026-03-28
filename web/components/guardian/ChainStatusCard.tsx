"use client";

import { ChainStateView } from "../../hooks/guardianTypes";
import { card, cardInner, mono, subtitle, title } from "./ui";
import { ShieldStateBadge } from "./ShieldStateBadge";

export function ChainStatusCard({ chain }: { chain: ChainStateView }) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={title}>{chain.chainName}</h2>
            <p style={subtitle}>Module, guard, and shield state for this chain.</p>
          </div>
          <ShieldStateBadge mode={chain.guardMode} />
        </div>
        <div style={{ marginTop: 16, display: "grid", gap: 10, fontSize: 13 }}>
          <div>Module enabled: {chain.moduleEnabled ? "Yes" : "No"}</div>
          <div>Guard address: <span style={mono}>{chain.guardAddress ?? "Pending"}</span></div>
          <div>Module address: <span style={mono}>{chain.moduleAddress ?? "Pending"}</span></div>
          <div>Shield until: {chain.shieldUntilTick ?? "None"}</div>
          <div>Last tx: <span style={mono}>{chain.lastTxHash ?? "None"}</span></div>
        </div>
      </div>
    </section>
  );
}
