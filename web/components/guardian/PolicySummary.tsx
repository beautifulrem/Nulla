"use client";

import { DEMO_POLICY_TITLE } from "../../hooks/guardianTypes";
import { card, cardInner, subtitle, title } from "./ui";

type Props = {
  policyTitle?: string;
  safeAddress: string;
  ownerAddress: string;
};

export function PolicySummary({ policyTitle = DEMO_POLICY_TITLE, safeAddress, ownerAddress }: Props) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <h2 style={title}>Policy Summary</h2>
        <p style={subtitle}>{policyTitle}</p>
        <div style={{ marginTop: 16, display: "grid", gap: 10, fontSize: 13 }}>
          <div>Safe: {safeAddress}</div>
          <div>Controller: {ownerAddress}</div>
          <div>Scope: Ethereum Sepolia + Base Sepolia via one Lasna policy engine</div>
        </div>
      </div>
    </section>
  );
}
