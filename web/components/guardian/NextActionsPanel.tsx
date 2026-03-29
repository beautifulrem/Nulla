"use client";

import { useState } from "react";
import { getChainMetadata } from "../../lib/chains";
import type { OnboardGuardianResult } from "../../hooks/guardianTypes";
import { useEnableSafeActions } from "../../hooks/useEnableSafeActions";
import { card, cardGlow, cardInner, eyebrow, monoWrap, secondaryButton, subtitle, tertiaryButton, title } from "./ui";

export function NextActionsPanel({
  result,
  safeAddress,
  ownerAddress,
}: {
  result: OnboardGuardianResult | null;
  safeAddress: string;
  ownerAddress: string;
}) {
  const { steps, executeStep } = useEnableSafeActions(result);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div>
          <div style={eyebrow}>Cross-chain onboarding steps</div>
          <h2 style={title}>One submission. Four Safe actions.</h2>
          <p style={subtitle}>
            The backend returns the exact actions the Safe owner still needs to sign on each chain.
          </p>
        </div>
        {localError ? (
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255, 112, 93, 0.34)",
              background: "rgba(255, 112, 93, 0.12)",
              color: "#ffd1c7",
              padding: 14,
              fontSize: 13,
            }}
          >
            {localError}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 12 }}>
          {steps.length ? (
            steps.map((action, index) => {
              const chain = getChainMetadata(action.chainId);
              return (
                <article
                  key={action.id}
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.035)",
                    padding: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Step {index + 1}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>{action.title}</div>
                    </div>
                    <div
                      style={{
                        alignSelf: "flex-start",
                        padding: "7px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}
                    >
                      {chain.name}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--text-secondary)" }}>{action.description}</p>
                  <div
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(7, 14, 29, 0.62)",
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Target
                    </div>
                    <div style={{ fontSize: 12, ...monoWrap }}>{action.to}</div>
                    {action.hash ? <div style={{ fontSize: 12, ...monoWrap }}>Tx: {action.hash}</div> : null}
                    {action.error ? <div style={{ fontSize: 12, color: "#ffd1c7" }}>{action.error}</div> : null}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                        ...(action.completed ? secondaryButton : tertiaryButton),
                        minHeight: 44,
                        cursor: action.completed || action.executing ? "default" : "pointer",
                        opacity: action.executing ? 0.8 : 1,
                      }}
                    >
                      {action.completed ? "Executed" : action.executing ? "Executing..." : "Execute via Safe"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(action.data);
                      }}
                      style={{ ...tertiaryButton, minHeight: 44 }}
                    >
                      Copy calldata
                    </button>
                  </div>
                </article>
              );
            })
          ) : result?.profileId ? (
            <div
              style={{
                borderRadius: 20,
                border: "1px dashed rgba(89, 231, 161, 0.24)",
                padding: 18,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              This Safe is already configured on both chains. Open the security console or run the
              live risky approval from the demo page.
            </div>
          ) : (
            <div
              style={{
                borderRadius: 20,
                border: "1px dashed rgba(255,255,255,0.14)",
                padding: 18,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Submit the onboarding form to receive the chain-specific Safe actions.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
