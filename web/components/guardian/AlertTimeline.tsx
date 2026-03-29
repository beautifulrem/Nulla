"use client";

import { getExplorerTxUrl } from "../../lib/chains";
import type { TimelineEntry } from "../../hooks/guardianTypes";
import { card, cardGlow, cardInner, eyebrow, formatAddress, mono, subtitle, timelineTrack, title } from "./ui";

export function AlertTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <section style={card}>
      <div style={cardGlow} />
      <div style={{ ...cardInner, position: "relative", display: "grid", gap: 16 }}>
        <div style={eyebrow}>Cross-chain timeline</div>
        <div>
          <h2 style={title}>One alert, one story, three chains.</h2>
          <p style={subtitle}>
            Each alert is grouped into a single cross-chain storyline: risk detection, reactive
            processing, source revoke, peer shield, and recovery.
          </p>
        </div>
        <div style={timelineTrack}>
          {entries.length === 0 ? (
            <div
              style={{
                borderRadius: 20,
                border: "1px dashed rgba(255,255,255,0.14)",
                padding: 18,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              No alerts yet. The console is armed and waiting for the next risky approval.
            </div>
          ) : (
            entries.map((entry) => (
              <article
                key={entry.alertId}
                style={{
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: 18,
                  display: "grid",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Alert thread
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em" }}>{entry.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{entry.originChainName}</div>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {entry.events.map((event, index) => (
                    <div
                      key={`${entry.alertId}-${event.kind}-${event.chainName}-${index}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            background: tone(event.kind),
                            boxShadow: `0 0 0 6px color-mix(in srgb, ${tone(event.kind)} 18%, transparent)`,
                            marginTop: 4,
                          }}
                        />
                        {index < entry.events.length - 1 ? (
                          <span style={{ width: 2, minHeight: 56, borderRadius: 999, background: "rgba(255,255,255,0.12)" }} />
                        ) : null}
                      </div>
                      <div
                        style={{
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(7, 14, 29, 0.58)",
                          padding: 14,
                          display: "grid",
                          gap: 5,
                        }}
                      >
                        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                          {event.kind} on {event.chainName}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>{event.label}</div>
                        {event.hash ? (
                          <a
                            href={getExplorerTxUrl(labelToChainId(event.chainName), event.hash)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, ...mono, color: "var(--accent-cool)" }}
                          >
                            {formatAddress(event.hash, 10, 8)}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function labelToChainId(chainName: TimelineEntry["originChainName"]) {
  return chainName === "Lasna / Reactscan"
    ? 5318007
    : chainName === "Base Sepolia"
      ? 84532
      : 11155111;
}

function tone(kind: TimelineEntry["events"][number]["kind"]) {
  switch (kind) {
    case "RiskDetected":
      return "var(--accent-risk)";
    case "Lasna REACT tx":
      return "var(--accent-cool)";
    case "Source revoke":
      return "var(--accent-safe)";
    case "Peer shield":
      return "#ffb56b";
    case "Shield exit":
      return "var(--accent-safe)";
    default:
      return "var(--accent-cool)";
  }
}
