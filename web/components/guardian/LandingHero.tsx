import type { CSSProperties } from "react";
import Link from "next/link";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS } from "../../hooks/guardianTypes";
import {
  card,
  cardGlow,
  cardInner,
  contentWrap,
  eyebrow,
  formatAddress,
  grid3,
  heroCopy,
  heroGrid,
  heroTitle,
  metricLabel,
  metricValue,
  monoWrap,
  pageShell,
  panelSoft,
  primaryButton,
  secondaryButton,
  subtitle,
  title,
} from "./ui";

const MAINLINE_RC = process.env.NEXT_PUBLIC_REACTIVE_LASNA_ADDRESS ?? "Pending";
const RISK_SPENDER = "0x301E4F2bA24b4C009BfDCc5F7F192f6A0f9C8e8d";

export function LandingHero() {
  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <section style={{ ...card, padding: 0 }}>
          <div style={cardGlow} />
          <div style={{ ...cardInner, padding: 28 }}>
            <div style={heroGrid}>
              <div style={eyebrow}>
                <span style={statusDot("var(--accent-safe)")} />
                <span>Nulla Cross-Chain Security Control</span>
              </div>
              <h1 style={heroTitle}>One Guardian Mode for two Safe chains.</h1>
              <p style={heroCopy}>
                Nulla turns the same Safe address on Ethereum Sepolia and Base Sepolia into one
                cross-chain security system. A risky approval on one chain can revoke locally and
                tighten the other chain immediately through Reactive Lasna.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href="/guardian/setup" style={primaryButton}>
                  Enable Guardian Mode
                </Link>
                <Link href="/demo" style={secondaryButton}>
                  Open Demo Flow
                </Link>
              </div>
            </div>
            <div style={{ ...grid3, marginTop: 24 }}>
              <MetricCard label="Protected Chains" value="2" detail="Ethereum Sepolia + Base Sepolia" />
              <MetricCard label="Control Layer" value="Lasna" detail={formatAddress(MAINLINE_RC, 8, 6)} />
              <MetricCard label="Risk Spender" value={formatAddress(RISK_SPENDER, 7, 5)} detail="Blacklisted test address" />
            </div>
            <div style={{ ...grid3, marginTop: 18 }}>
              <FactCard title="Shared Safe" value={DEMO_SAFE_ADDRESS} />
              <FactCard title="Safe Owner" value={DEMO_OWNER_ADDRESS} />
              <FactCard title="Operating Model" value="Detect -> React -> Revoke + Shield" />
            </div>
            <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
              <div style={eyebrow}>
                <span style={statusDot("var(--accent-cool)")} />
                <span>System Flow</span>
              </div>
              <div style={grid3}>
                <FlowCard
                  step="01"
                  title="Detect On Origin"
                  body="Watch Safe approvals on Ethereum Sepolia and Base Sepolia for the configured risky spender."
                />
                <FlowCard
                  step="02"
                  title="React On Lasna"
                  body="A single Reactive contract evaluates the risk and decides the revoke + shield response path."
                />
                <FlowCard
                  step="03"
                  title="Protect Across Chains"
                  body="The source chain approval is revoked while the peer chain enters Shield Mode until recovery."
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section style={panelSoft}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>{detail}</div>
    </section>
  );
}

function FactCard({ title: label, value }: { title: string; value: string }) {
  return (
    <section
      style={{
        ...panelSoft,
        display: "grid",
        gap: 8,
        minHeight: 106,
      }}
    >
      <div style={metricLabel}>{label}</div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-primary)", ...monoWrap }}>{value}</div>
    </section>
  );
}

function FlowCard({ step, title: heading, body }: { step: string; title: string; body: string }) {
  return (
    <article
      style={{
        ...panelSoft,
        position: "relative",
        overflow: "hidden",
        minHeight: 160,
      }}
    >
      <div style={{ ...metricLabel, color: "var(--accent-cool)" }}>{step}</div>
      <h2 style={{ ...title, marginTop: 14 }}>{heading}</h2>
      <p style={{ ...subtitle, marginTop: 10 }}>{body}</p>
    </article>
  );
}

function statusDot(color: string): CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 18%, transparent)`,
  };
}
