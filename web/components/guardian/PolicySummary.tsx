"use client";

import { DEMO_POLICY_TITLE } from "../../hooks/guardianTypes";
import { card, cardGlow, cardInner, eyebrow, formatAddress, monoWrap, subtitle, title } from "./ui";

type Props = {
  policyTitle?: string;
  safeAddress: string;
  ownerAddress: string;
};

export function PolicySummary({ policyTitle = DEMO_POLICY_TITLE, safeAddress, ownerAddress }: Props) {
  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div style={eyebrow}>Policy Summary</div>
        <div>
          <h2 style={title}>{policyTitle}</h2>
          <p style={subtitle}>
            One Lasna policy engine watches approval risk and coordinates source-chain revoke with
            peer-chain Shield Mode.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gap: 12,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.035)",
            padding: 16,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 11 }}>
              Protected Safe
            </div>
            <div style={{ marginTop: 6, ...monoWrap }}>{formatAddress(safeAddress, 8, 6)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 11 }}>
              Controller
            </div>
            <div style={{ marginTop: 6, ...monoWrap }}>{formatAddress(ownerAddress, 8, 6)}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 11 }}>
              Scope
            </div>
            <div style={{ marginTop: 6, color: "var(--text-secondary)" }}>
              Ethereum Sepolia + Base Sepolia via one Reactive Lasna control layer.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
