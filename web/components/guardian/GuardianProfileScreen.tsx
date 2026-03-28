"use client";

import { useGuardianActivity } from "../../hooks/useGuardianActivity";
import { useGuardianProfile } from "../../hooks/useGuardianProfile";
import { useGuardianStatus } from "../../hooks/useGuardianStatus";
import { AlertTimeline } from "./AlertTimeline";
import { ChainStatusCard } from "./ChainStatusCard";
import { GuardianModeCard } from "./GuardianModeCard";
import { PolicySummary } from "./PolicySummary";
import { RiskEventCard } from "./RiskEventCard";
import { contentWrap, grid2, grid3, pageShell, subtitle, title } from "./ui";

export function GuardianProfileScreen({ profileId }: { profileId: string }) {
  const profile = useGuardianProfile(profileId);
  const status = useGuardianStatus(profileId);
  const activity = useGuardianActivity(profileId);
  const profileData = profile.data ?? status.data;

  const chainReadiness = status.data?.chainReadiness ?? profileData?.chainReadiness ?? [];
  const lastAlert = status.data?.lastAlert ?? profileData?.lastAlert ?? null;

  return (
    <div style={pageShell}>
      <main style={contentWrap}>
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(229,238,252,0.65)" }}>
            Guardian console
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(30px, 5vw, 54px)", letterSpacing: "-0.05em" }}>
            Cross-chain policy for one Safe
          </h1>
          <p style={{ margin: 0, maxWidth: 820, fontSize: 16, lineHeight: 1.7, color: "rgba(229,238,252,0.74)" }}>
            Same profile, two chains, one alert timeline. Base can revoke locally while Ethereum enters Shield Mode.
          </p>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <GuardianModeCard
            armed={Boolean(profileData && profileData.status === "Active")}
            profileId={profileId}
            statusLabel={status.error ?? (status.loading ? "Refreshing status..." : "Armed and watching both chains")}
          />
          <div style={grid2}>
            <PolicySummary
              safeAddress={profileData?.safeAddress ?? ""}
              ownerAddress={profileData?.ownerAddress ?? ""}
              policyTitle={profileData?.policyTitle}
            />
            {lastAlert ? <RiskEventCard alert={lastAlert} /> : <PolicySummary safeAddress={profileId} ownerAddress="Pending" policyTitle="No alert yet" />}
          </div>
          <div style={grid3}>
            {chainReadiness.map((chain) => (
              <ChainStatusCard key={chain.chainId} chain={chain} />
            ))}
          </div>
          <AlertTimeline entries={activity.data ?? []} />
          <section style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Current profile status</div>
            <p style={{ ...subtitle, marginTop: 8 }}>
              {status.loading ? "Refreshing from API..." : "The console stays synchronized with `alertId`-grouped cross-chain events."}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
