import type { CSSProperties } from "react";
import Link from "next/link";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS } from "../../hooks/guardianTypes";
import { card, cardInner, mono, pageShell, subtitle, title } from "./ui";

export function LandingHero() {
  return (
    <div style={pageShell}>
      <main style={{ ...cardInner, maxWidth: 1240, margin: "0 auto", paddingTop: 48 }}>
        <section
          style={{
            ...card,
            padding: 28,
            background:
              "linear-gradient(135deg, rgba(245,184,122,0.16) 0%, rgba(138,211,255,0.12) 45%, rgba(8,15,34,0.82) 100%)",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,238,252,0.65)" }}>
              Nulla Cross-chain Shield
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 0.95, letterSpacing: "-0.05em" }}>
              One Guardian Mode for two Safe chains.
            </h1>
            <p style={{ margin: 0, maxWidth: 760, fontSize: 18, lineHeight: 1.7, color: "rgba(229,238,252,0.76)" }}>
              Same Safe address, same owner, one reactive policy layer. A risk on Base Sepolia can revoke locally and
              tighten Ethereum Sepolia immediately.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link href="/guardian/setup" style={linkButton}>
                Start onboarding
              </Link>
              <Link href="/demo" style={secondaryLinkButton}>
                Open demo flow
              </Link>
            </div>
            <div style={{ display: "grid", gap: 6, fontSize: 13, color: "rgba(229,238,252,0.66)" }}>
              <div>Safe: <span style={mono}>{DEMO_SAFE_ADDRESS}</span></div>
              <div>Owner: <span style={mono}>{DEMO_OWNER_ADDRESS}</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const linkButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 16,
  background: "linear-gradient(135deg, #f5b87a 0%, #8ad3ff 100%)",
  color: "#0b1020",
  fontWeight: 700,
  textDecoration: "none",
};

const secondaryLinkButton: CSSProperties = {
  ...linkButton,
  background: "rgba(255,255,255,0.07)",
  color: "#e5eefc",
  border: "1px solid rgba(255,255,255,0.12)",
};
