"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS } from "../../hooks/guardianTypes";
import { DEFAULT_RISK_SPENDER, DEMO_PROFILE_ID } from "../../lib/constants";
import { card, cardGlow, cardInner, contentWrap, eyebrow, formatAddress, grid3, monoWrap, pageShell, primaryButton, secondaryButton, subtitle, tertiaryButton, title } from "./ui";

const MAINLINE_RC = process.env.NEXT_PUBLIC_REACTIVE_LASNA_ADDRESS ?? "Pending";

export function DemoScreen() {
  const [running, setRunning] = useState<"eth" | "base" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hashes, setHashes] = useState<{ eth?: string; base?: string }>({});

  async function runRisk(chainId: number, side: "eth" | "base") {
    setRunning(side);
    setError(null);
    try {
      const response = await fetch("/api/demo/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainId }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Risk demo failed with status ${response.status}`);
      }
      const payload = (await response.json()) as { hash: string };
      setHashes((current) => ({ ...current, [side]: payload.hash }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to trigger the risky approval.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <section style={{ ...card, padding: 0 }}>
          <div style={cardGlow} />
          <div style={{ ...cardInner, position: "relative", display: "grid", gap: 18 }}>
            <div style={eyebrow}>Live demo script</div>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 62px)", lineHeight: 0.96, letterSpacing: "-0.06em", fontFamily: "var(--font-heading)" }}>
              2-minute cross-chain proof.
            </h1>
            <p style={{ margin: 0, maxWidth: 840, fontSize: 17, lineHeight: 1.75, color: "var(--text-secondary)" }}>
              Start from the shared Safe, trigger one risky approval, and show that Lasna turns it
              into source-chain revoke plus peer-chain Shield Mode.
            </p>

            <div style={grid3}>
              <Fact title="Shared Safe" value={formatAddress(DEMO_SAFE_ADDRESS, 8, 6)} />
              <Fact title="Owner" value={formatAddress(DEMO_OWNER_ADDRESS, 8, 6)} />
              <Fact title="Mainline RC" value={formatAddress(MAINLINE_RC, 8, 6)} />
            </div>

            <section
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.035)",
                padding: 18,
                display: "grid",
                gap: 14,
              }}
            >
              <h2 style={title}>Stage script</h2>
              <p style={subtitle}>Use this sequence exactly during the hackathon presentation.</p>
              <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 12, fontSize: 14, lineHeight: 1.7, color: "var(--text-primary)" }}>
                <li>Open Guardian Mode for the shared Safe address.</li>
                <li>Show the one policy watching Ethereum Sepolia and Base Sepolia together.</li>
                <li>Trigger the risky spender approval from Base Sepolia or Ethereum Sepolia.</li>
                <li>Show Lasna react, Base revoke, and Ethereum Shield Mode.</li>
                <li>Wait for recovery or use the manual Shield exit fallback.</li>
              </ol>
            </section>

            <section
              style={{
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.035)",
                padding: 18,
                display: "grid",
                gap: 14,
              }}
            >
              <h2 style={title}>Run live chain actions</h2>
              <p style={subtitle}>
                These buttons execute the risky Safe approval through the demo owner on-chain. Use
                them to prove the end-to-end loop from the web UI without relying on manual shell commands.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => void runRisk(84532, "base")}
                  disabled={Boolean(running)}
                  style={{ ...primaryButton, cursor: running ? "wait" : "pointer" }}
                >
                  {running === "base" ? "Running Base risk..." : "Run Base risk approval"}
                </button>
                <button
                  type="button"
                  onClick={() => void runRisk(11155111, "eth")}
                  disabled={Boolean(running)}
                  style={{ ...tertiaryButton, cursor: running ? "wait" : "pointer" }}
                >
                  {running === "eth" ? "Running ETH risk..." : "Run Ethereum risk approval"}
                </button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <DemoFact label="Risk spender" value={DEFAULT_RISK_SPENDER} />
                <DemoFact label="Latest Base approval tx" value={hashes.base ?? "Pending"} />
                <DemoFact label="Latest Ethereum approval tx" value={hashes.eth ?? "Pending"} />
              </div>
              {error ? (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(255, 112, 93, 0.32)",
                    background: "rgba(255, 112, 93, 0.12)",
                    padding: 12,
                    color: "#ffd1c7",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              ) : null}
            </section>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/guardian/setup" style={primaryButton}>
                Open onboarding
              </Link>
              <Link href={`/guardian/${DEMO_PROFILE_ID}`} style={secondaryButton}>
                Open security console
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Fact({ title: label, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7, 14, 29, 0.58)",
        padding: 14,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function DemoFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-primary)", ...monoWrap }}>{value}</div>
    </div>
  );
}
