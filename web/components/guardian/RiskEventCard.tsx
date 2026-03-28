"use client";

import { AlertView } from "../../hooks/guardianTypes";
import { card, cardInner, mono, subtitle, title } from "./ui";

export function RiskEventCard({ alert }: { alert: AlertView }) {
  return (
    <section style={card}>
      <div style={cardInner}>
        <h2 style={title}>Detected on {alert.originChainName}</h2>
        <p style={subtitle}>Reactive event linked by `alertId`.</p>
        <div style={{ marginTop: 16, display: "grid", gap: 10, fontSize: 13 }}>
          <div>Alert: <span style={mono}>{alert.alertId}</span></div>
          <div>Token: <span style={mono}>{alert.token}</span></div>
          <div>Spender: <span style={mono}>{alert.spender}</span></div>
          <div>Reason mask: {alert.reasonMask}</div>
          <div>Risk score: {alert.riskScore}</div>
          <div>React tx: <span style={mono}>{alert.reactTxHash ?? "Pending"}</span></div>
        </div>
      </div>
    </section>
  );
}
