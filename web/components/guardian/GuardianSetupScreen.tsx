"use client";

import { useGuardianSetupForm } from "../../hooks/useGuardianSetupForm";
import { useOnboardGuardian } from "../../hooks/useOnboardGuardian";
import { OnboardingForm } from "./OnboardingForm";
import { NextActionsPanel } from "./NextActionsPanel";
import { GuardianModeCard } from "./GuardianModeCard";
import { PolicySummary } from "./PolicySummary";
import { card, cardInner, contentWrap, grid2, pageShell, subtitle, title } from "./ui";
import { DEMO_OWNER_ADDRESS, DEMO_SAFE_ADDRESS, DEMO_POLICY_TITLE } from "../../hooks/guardianTypes";

export function GuardianSetupScreen() {
  const { form, updateField, updateListField, addListItem, removeListItem } = useGuardianSetupForm({
    safeAddress: DEMO_SAFE_ADDRESS,
    ownerAddress: DEMO_OWNER_ADDRESS,
  });
  const { data, error, loading, submit } = useOnboardGuardian();
  const steps = data?.nextActions ?? [];

  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,238,252,0.65)" }}>
            Guardian onboarding
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 54px)", letterSpacing: "-0.05em" }}>Enable Guardian Mode once.</h1>
          <p style={{ margin: 0, maxWidth: 820, fontSize: 16, lineHeight: 1.7, color: "rgba(229,238,252,0.74)" }}>
            This form packages two Safe chains into one onboarding flow. The backend returns the exact chain-specific actions.
          </p>
        </div>
        <div style={grid2}>
          <OnboardingForm
            form={form}
            onChange={updateField}
            onListChange={updateListField}
            onListAdd={addListItem}
            onListRemove={removeListItem}
            onSubmit={() => void submit(form)}
            submitting={loading}
          />
          <div style={{ display: "grid", gap: 16 }}>
            <GuardianModeCard armed={Boolean(data?.profileId)} profileId={data?.profileId ?? undefined} statusLabel={error ?? "Awaiting onboarding submission"} />
            <PolicySummary safeAddress={form.safeAddress} ownerAddress={form.ownerAddress} policyTitle={DEMO_POLICY_TITLE} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "grid", gap: 16 }}>
          <NextActionsPanel result={data} safeAddress={form.safeAddress} ownerAddress={form.ownerAddress} />
          <section style={card}>
            <div style={cardInner}>
              <h2 style={title}>Ready Steps</h2>
              <p style={subtitle}>These are the Safe actions the owner still needs to sign.</p>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {steps.length ? (
                  steps.map((step) => (
                    <div key={`${step.chainId}:${step.title}`} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{step.title}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "rgba(229,238,252,0.68)" }}>{step.description}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 13, color: "rgba(229,238,252,0.6)" }}>Submit the form to see the next Safe actions.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
