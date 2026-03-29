"use client";

import Link from "next/link";
import { useGuardianSetupForm } from "../../hooks/useGuardianSetupForm";
import { useGuardianStatus } from "../../hooks/useGuardianStatus";
import { useOnboardGuardian } from "../../hooks/useOnboardGuardian";
import { OnboardingForm } from "./OnboardingForm";
import { NextActionsPanel } from "./NextActionsPanel";
import { GuardianModeCard } from "./GuardianModeCard";
import { PolicySummary } from "./PolicySummary";
import { card, cardGlow, cardInner, contentWrap, eyebrow, grid2, grid3, monoWrap, pageShell, primaryButton, subtitle, title } from "./ui";
import { DEMO_OWNER_ADDRESS, DEMO_POLICY_TITLE, DEMO_SAFE_ADDRESS } from "../../hooks/guardianTypes";
import { DEFAULT_RISK_SPENDER, DEMO_PROFILE_ID } from "../../lib/constants";

export function GuardianSetupScreen() {
  const { form, updateField, updateListField, addListItem, removeListItem } = useGuardianSetupForm({
    safeAddress: DEMO_SAFE_ADDRESS,
    ownerAddress: DEMO_OWNER_ADDRESS,
    tokenEth: process.env.NEXT_PUBLIC_ETH_TOKEN_ADDRESS ?? "",
    tokenBase: process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS ?? "",
    blacklist: [DEFAULT_RISK_SPENDER],
  });
  const { data, error, loading, submit } = useOnboardGuardian();
  const activeProfileId = data?.profileId ?? DEMO_PROFILE_ID;
  const liveStatus = useGuardianStatus(activeProfileId);
  const liveBadgeMode =
    liveStatus.data?.shieldEth || liveStatus.data?.shieldBase ? "SHIELD" : "MONITOR";
  const statusLabel = error
    ? error
    : loading
      ? "Composing Guardian Mode..."
      : liveStatus.loading && !data?.profileId
        ? "Refreshing live chain state..."
      : data?.resumeFrom === "ready"
        ? "This Safe is already configured on both chains and ready for the live demo."
        : liveStatus.data?.shieldEth || liveStatus.data?.shieldBase
          ? "A live Shield is active on one chain. Open the security console to inspect or clear it."
        : data?.profileId
          ? data.nextActions.length
            ? "Profile created. Review the exact Safe actions below."
            : "Guardian Mode is configured and ready."
          : "Waiting for onboarding submission";

  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <section style={{ ...card, padding: 0, marginBottom: 22 }}>
          <div style={cardGlow} />
          <div style={{ ...cardInner, position: "relative", display: "grid", gap: 20 }}>
            <div style={eyebrow}>Guardian onboarding</div>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 62px)", lineHeight: 0.95, letterSpacing: "-0.06em", fontFamily: "var(--font-heading)" }}>
              Turn one Safe into a cross-chain security control room.
            </h1>
            <p style={{ margin: 0, maxWidth: 860, fontSize: 17, lineHeight: 1.75, color: "var(--text-secondary)" }}>
              This setup flow packages Ethereum Sepolia, Base Sepolia, and Lasna into one
              Guardian Mode onboarding. The owner signs a short set of exact Safe actions instead
              of learning each chain separately.
            </p>
            <div style={grid3}>
              <SummaryChip title="Protected Safe" value={DEMO_SAFE_ADDRESS} />
              <SummaryChip title="Owner" value={DEMO_OWNER_ADDRESS} />
              <SummaryChip title="Policy" value={DEMO_POLICY_TITLE} />
            </div>
          </div>
        </section>

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
          <div style={{ display: "grid", gap: 18 }}>
            <GuardianModeCard
              armed={Boolean(data?.profileId ?? liveStatus.data?.armed)}
              profileId={activeProfileId}
              statusLabel={statusLabel}
              badgeMode={liveBadgeMode}
            />
            <PolicySummary safeAddress={form.safeAddress} ownerAddress={form.ownerAddress} policyTitle={DEMO_POLICY_TITLE} />
            <section style={card}>
              <div style={cardGlow} />
              <div style={{ ...cardInner, position: "relative", display: "grid", gap: 12 }}>
                <div style={eyebrow}>Deployment preview</div>
                <h2 style={title}>Three-chain control path</h2>
                <p style={subtitle}>
                  The onboarding output will wire a Safe module, a Safe guard, and a Lasna policy
                  engine into one cross-chain protection loop.
                </p>
                <div style={{ ...grid3, marginTop: 4 }}>
                  <MiniPanel title="Ethereum Sepolia" body="Module + guard for peer-chain shield and revoke callbacks." />
                  <MiniPanel title="Lasna" body="Reactive policy engine that processes approvals and schedules shield recovery." />
                  <MiniPanel title="Base Sepolia" body="Module + guard for origin-chain revoke and peer-chain shield." />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <NextActionsPanel result={data} safeAddress={form.safeAddress} ownerAddress={form.ownerAddress} />
        </div>

        {data?.profileId ? (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <Link href={`/guardian/${data.profileId}`} style={primaryButton}>
              Open security console
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SummaryChip({ title: label, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.035)",
        padding: 14,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)", ...monoWrap }}>{value}</div>
    </div>
  );
}

function MiniPanel({ title: heading, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7, 14, 29, 0.55)",
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800 }}>{heading}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>{body}</div>
    </div>
  );
}
