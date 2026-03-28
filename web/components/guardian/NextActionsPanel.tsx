"use client";

import { useState } from "react";
import { OnboardGuardianResult } from "../../hooks/guardianTypes";
import { useEnableSafeActions } from "../../hooks/useEnableSafeActions";
import { card, cardInner, subtitle, title } from "./ui";

export function NextActionsPanel({
  result,
  safeAddress,
  ownerAddress
}: {
  result: OnboardGuardianResult | null;
  safeAddress: string;
  ownerAddress: string;
}) {
  const { steps, executeStep } = useEnableSafeActions(result);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <section style={card}>
      <div style={cardInner}>
        <h2 style={title}>Next Actions</h2>
        <p style={subtitle}>The backend returns the chain-specific actions the owner still needs to sign.</p>
        {localError ? <div style={{ marginTop: 12, fontSize: 12, color: "#ffb4b4" }}>{localError}</div> : null}
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {steps.length ? (
            steps.map((action) => (
              <div
                key={action.id}
                style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{action.title}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "rgba(229,238,252,0.68)" }}>{action.description}</div>
                <div style={{ marginTop: 6, fontSize: 11, color: "rgba(229,238,252,0.55)" }}>to: {action.to}</div>
                {action.hash ? <div style={{ marginTop: 6, fontSize: 11 }}>Tx: {action.hash}</div> : null}
                {action.error ? <div style={{ marginTop: 6, fontSize: 11, color: "#ffb4b4" }}>{action.error}</div> : null}
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setLocalError(null);
                      try {
                        await executeStep(action.id, safeAddress, ownerAddress);
                      } catch (error) {
                        setLocalError(error instanceof Error ? error.message : "Failed to execute Safe action");
                      }
                    }}
                    disabled={action.completed || action.executing}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: action.completed ? "rgba(91, 255, 145, 0.15)" : "rgba(255,255,255,0.08)",
                      color: "#e5eefc",
                      padding: "10px 12px",
                      cursor: action.completed || action.executing ? "default" : "pointer"
                    }}
                  >
                    {action.completed ? "Executed" : action.executing ? "Executing..." : "Execute via Safe"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(action.data);
                    }}
                    style={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "transparent",
                      color: "#e5eefc",
                      padding: "10px 12px",
                      cursor: "pointer"
                    }}
                  >
                    Copy calldata
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 13, color: "rgba(229,238,252,0.6)" }}>Waiting for onboarding output.</div>
          )}
        </div>
      </div>
    </section>
  );
}
