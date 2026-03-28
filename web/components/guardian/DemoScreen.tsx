"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS } from "../../hooks/guardianTypes";
import { card, cardInner, contentWrap, pageShell, subtitle, title } from "./ui";

export function DemoScreen() {
  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,238,252,0.65)" }}>
            Demo flow
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 54px)", letterSpacing: "-0.05em" }}>2-minute cross-chain proof</h1>
          <p style={{ margin: 0, maxWidth: 840, fontSize: 16, lineHeight: 1.7, color: "rgba(229,238,252,0.74)" }}>
            Show the same Safe address on Sepolia and Base Sepolia, then prove that a Base risk can revoke locally and
            move Ethereum into Shield Mode.
          </p>
        </div>
        <section style={card}>
          <div style={cardInner}>
            <h2 style={title}>Script</h2>
            <p style={subtitle}>Use this exact sequence during the live demo.</p>
            <ol style={{ marginTop: 16, display: "grid", gap: 12, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
              <li>Open Guardian Mode for the shared Safe address.</li>
              <li>Show the single policy watching Ethereum Sepolia and Base Sepolia.</li>
              <li>On Base Sepolia, approve an unknown spender.</li>
              <li>Show Lasna react, Base revoke, and Ethereum Shield Mode.</li>
              <li>Wait for Cron10 and show Shield exit.</li>
            </ol>
            <div style={{ marginTop: 18, display: "grid", gap: 8, fontSize: 13, color: "rgba(229,238,252,0.68)" }}>
              <div>Safe: {DEMO_SAFE_ADDRESS}</div>
              <div>Owner: {DEMO_OWNER_ADDRESS}</div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/guardian/setup" style={button}>
                Open onboarding
              </Link>
              <Link href="/guardian/setup" style={buttonSecondary}>
                Back to onboarding
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "0 16px",
  borderRadius: 14,
  background: "linear-gradient(135deg, #f5b87a 0%, #8ad3ff 100%)",
  color: "#0b1020",
  fontWeight: 700,
  textDecoration: "none",
};

const buttonSecondary: CSSProperties = {
  ...button,
  background: "rgba(255,255,255,0.07)",
  color: "#e5eefc",
  border: "1px solid rgba(255,255,255,0.12)",
};
